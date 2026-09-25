import 'package:flutter/material.dart';

import 'open_ai_client.dart';
import 'open_ai_settings.dart';

class OpenAiSettingsPage extends StatefulWidget {
  const OpenAiSettingsPage({
    required this.client,
    required this.store,
    super.key,
  });

  final OpenAiClient client;
  final OpenAiSettingsStore store;

  @override
  State<OpenAiSettingsPage> createState() => _OpenAiSettingsPageState();
}

class _OpenAiSettingsPageState extends State<OpenAiSettingsPage> {
  final _keyController = TextEditingController();
  OpenAiSettings? _settings;
  String _model = OpenAiSettingsStore.defaultModel;
  String? _message;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _keyController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final settings = await widget.store.read();
    if (!mounted) return;
    setState(() {
      _settings = settings;
      _model = settings.model;
    });
  }

  Future<void> _save() async {
    if (_busy || _settings == null) return;
    final replacement = _keyController.text.trim();
    final apiKey = replacement.isEmpty
        ? await widget.store.readApiKey()
        : replacement;
    if (apiKey == null || apiKey.isEmpty) {
      setState(() => _message = 'กรุณาใส่ API key');
      return;
    }
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.client.validateKey(apiKey: apiKey, model: _model);
      await widget.store.save(apiKey: apiKey, model: _model, verified: true);
      _keyController.clear();
      await _load();
      if (mounted) setState(() => _message = 'บันทึกและตรวจสอบสำเร็จ');
    } on OpenAiNetworkError catch (error) {
      if (replacement.isNotEmpty) {
        await widget.store.save(apiKey: apiKey, model: _model, verified: false);
        _keyController.clear();
        await _load();
        if (mounted) {
          setState(
            () =>
                _message = '${error.message} บันทึก key ไว้แล้วแต่ยังไม่ยืนยัน',
          );
        }
      } else if (mounted) {
        setState(() => _message = error.message);
      }
    } on OpenAiRequestError catch (error) {
      if (mounted) setState(() => _message = error.thaiMessage);
    } catch (_) {
      if (mounted) setState(() => _message = 'บันทึกการตั้งค่าไม่ได้');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _deleteKey() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ลบ API key?'),
        content: const Text('การสแกนใบเสร็จจะใช้ไม่ได้จนกว่าจะเพิ่ม key ใหม่'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('ยกเลิก'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ลบ'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await widget.store.deleteKey();
    _keyController.clear();
    await _load();
    if (mounted) setState(() => _message = 'ลบ API key แล้ว');
  }

  @override
  Widget build(BuildContext context) {
    final settings = _settings;
    return Scaffold(
      appBar: AppBar(title: const Text('ตั้งค่า OpenAI')),
      body: settings == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text(
                  'API key จะเก็บไว้ในอุปกรณ์นี้และไม่ส่งเข้า WebView หรือ Google Sheet',
                ),
                const SizedBox(height: 12),
                Card(
                  color: Theme.of(context).colorScheme.errorContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.warning_amber_rounded,
                          color: Theme.of(context).colorScheme.onErrorContainer,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DefaultTextStyle.merge(
                            style: TextStyle(
                              color: Theme.of(
                                context,
                              ).colorScheme.onErrorContainer,
                            ),
                            child: const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'คำเตือนเรื่อง API key',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                SizedBox(height: 6),
                                Text(
                                  'อุปกรณ์ที่ถูกควบคุมหรือปลดล็อกระบบอาจทำให้ key รั่วไหลได้ '
                                  'ควรสร้าง Project API key แยกสำหรับแอปนี้ จำกัดสิทธิ์ '
                                  'ตั้งวันหมดอายุและวงเงินการใช้งาน และเพิกถอน key ทันทีหากอุปกรณ์สูญหาย',
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _keyController,
                  autocorrect: false,
                  enableSuggestions: false,
                  obscureText: true,
                  decoration: InputDecoration(
                    border: const OutlineInputBorder(),
                    labelText: settings.hasKey
                        ? 'API key ที่บันทึกไว้'
                        : 'API key',
                    hintText: settings.hasKey ? '••••••••••••' : null,
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _model,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: 'โมเดล',
                  ),
                  items: OpenAiSettingsStore.models
                      .map(
                        (model) =>
                            DropdownMenuItem(value: model, child: Text(model)),
                      )
                      .toList(),
                  onChanged: _busy
                      ? null
                      : (value) {
                          if (value != null) setState(() => _model = value);
                        },
                ),
                const SizedBox(height: 12),
                Text(
                  settings.isVerified
                      ? 'สถานะ: พร้อมใช้งาน'
                      : settings.hasKey
                      ? 'สถานะ: ยังไม่ได้ตรวจสอบ'
                      : 'สถานะ: ยังไม่ได้ตั้งค่า',
                ),
                if (_message != null) ...[
                  const SizedBox(height: 12),
                  Text(_message!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _busy ? null : _save,
                  child: Text(_busy ? 'กำลังตรวจสอบ...' : 'ตรวจสอบและบันทึก'),
                ),
                if (settings.hasKey) ...[
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _busy ? null : _deleteKey,
                    child: const Text('ลบ API key'),
                  ),
                ],
              ],
            ),
    );
  }
}
