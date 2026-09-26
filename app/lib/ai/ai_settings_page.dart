import 'package:flutter/material.dart';

import 'ai_provider.dart';
import 'ai_settings.dart';
import 'receipt_ai_client.dart';

class AiSettingsPage extends StatefulWidget {
  const AiSettingsPage({required this.clients, required this.store, super.key});

  final Map<AiProvider, ReceiptAiClient> clients;
  final AiSettingsStore store;

  @override
  State<AiSettingsPage> createState() => _AiSettingsPageState();
}

class _AiSettingsPageState extends State<AiSettingsPage> {
  static const _maskedApiKey = '••••';

  final _keyController = TextEditingController();
  AiSettings? _settings;
  AiProvider _activeProvider = AiProvider.openAi;
  AiProvider _provider = AiProvider.openAi;
  String _model = AiProvider.openAi.defaultModel;
  String? _message;
  bool _busy = false;
  bool _editing = true;
  bool _hasActiveKey = false;

  @override
  void initState() {
    super.initState();
    _loadActive();
  }

  @override
  void dispose() {
    _keyController.dispose();
    super.dispose();
  }

  Future<void> _loadActive() async {
    final settings = await widget.store.read();
    if (!mounted) return;
    _keyController.text = settings.hasKey ? _maskedApiKey : '';
    setState(() {
      _activeProvider = settings.provider;
      _provider = settings.provider;
      _settings = settings;
      _model = settings.model;
      _editing = !settings.hasKey;
      _hasActiveKey = settings.hasKey;
    });
  }

  Future<void> _selectProvider(AiProvider provider) async {
    setState(() {
      _busy = true;
      _message = null;
    });
    final settings = await widget.store.readProvider(provider);
    if (!mounted) return;
    _keyController.clear();
    setState(() {
      _provider = provider;
      _settings = settings;
      _model = settings.model;
      _busy = false;
    });
  }

  Future<void> _save() async {
    if (_busy || !_editing || _settings == null) return;
    final replacement = _keyController.text.trim();
    final apiKey = replacement.isEmpty
        ? await widget.store.readApiKey(_provider)
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
      final client = widget.clients[_provider];
      if (client == null) throw StateError('AI provider is unavailable.');
      await client.validateKey(apiKey: apiKey, model: _model);
      await widget.store.save(
        provider: _provider,
        apiKey: apiKey,
        model: _model,
        verified: true,
      );
      _keyController.clear();
      await _loadActive();
      if (mounted) setState(() => _message = 'บันทึกและตรวจสอบสำเร็จ');
    } on AiNetworkError catch (error) {
      if (replacement.isNotEmpty) {
        await widget.store.save(
          provider: _provider,
          apiKey: apiKey,
          model: _model,
          verified: false,
          activate: _provider == _activeProvider,
        );
        _keyController.clear();
        final settings = await widget.store.readProvider(_provider);
        if (mounted) {
          setState(() {
            _settings = settings;
            _message = '${error.message} บันทึก key ไว้แล้วแต่ยังไม่ยืนยัน';
          });
        }
      } else if (mounted) {
        setState(() => _message = error.message);
      }
    } on AiRequestError catch (error) {
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
        content: Text(
          'การสแกนใบเสร็จด้วย ${_provider.displayName} จะใช้ไม่ได้จนกว่าจะเพิ่ม key ใหม่',
        ),
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
    await widget.store.deleteKey(_provider);
    _keyController.clear();
    final settings = await widget.store.readProvider(_provider);
    if (mounted) {
      setState(() {
        _settings = settings;
        _message = 'ลบ API key แล้ว';
        if (_provider == _activeProvider) _hasActiveKey = false;
      });
    }
  }

  void _startEditing() {
    _keyController.clear();
    setState(() {
      _editing = true;
      _message = null;
    });
  }

  Future<void> _cancelEditing() async {
    if (_busy || !_hasActiveKey) return;
    setState(() {
      _busy = true;
      _message = null;
    });
    await _loadActive();
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final settings = _settings;
    return Scaffold(
      appBar: AppBar(title: const Text('ตั้งค่าผู้ให้บริการ AI')),
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
                DropdownButtonFormField<AiProvider>(
                  initialValue: _provider,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: 'ผู้ให้บริการ',
                  ),
                  items: AiProvider.values
                      .map(
                        (provider) => DropdownMenuItem(
                          value: provider,
                          child: Text(provider.displayName),
                        ),
                      )
                      .toList(),
                  onChanged: _busy || !_editing
                      ? null
                      : (provider) {
                          if (provider != null) _selectProvider(provider);
                        },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _keyController,
                  autocorrect: false,
                  enabled: _editing && !_busy,
                  enableSuggestions: false,
                  obscureText: true,
                  decoration: InputDecoration(
                    border: const OutlineInputBorder(),
                    labelText: settings.hasKey
                        ? '${_provider.displayName} API key ที่บันทึกไว้'
                        : '${_provider.displayName} API key',
                    hintText: settings.hasKey ? '••••••••••••' : null,
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  key: ValueKey('${_provider.id}:$_model'),
                  initialValue: _model,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: 'โมเดล',
                  ),
                  items: _provider.models
                      .map(
                        (model) =>
                            DropdownMenuItem(value: model, child: Text(model)),
                      )
                      .toList(),
                  onChanged: _busy || !_editing
                      ? null
                      : (value) {
                          if (value != null) setState(() => _model = value);
                        },
                ),
                const SizedBox(height: 12),
                Text(
                  settings.isVerified
                      ? _provider == _activeProvider
                            ? 'สถานะ: พร้อมใช้งานและกำลังใช้อยู่'
                            : 'สถานะ: พร้อมใช้งาน กดตรวจสอบและบันทึกเพื่อเลือกผู้ให้บริการนี้'
                      : settings.hasKey
                      ? 'สถานะ: ยังไม่ได้ตรวจสอบ'
                      : 'สถานะ: ยังไม่ได้ตั้งค่า',
                ),
                if (_message != null) ...[
                  const SizedBox(height: 12),
                  Text(_message!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 20),
                if (!_editing)
                  FilledButton.icon(
                    onPressed: _busy ? null : _startEditing,
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('แก้ไข API key'),
                  )
                else ...[
                  FilledButton(
                    onPressed: _busy ? null : _save,
                    child: Text(_busy ? 'กำลังตรวจสอบ...' : 'ตรวจสอบและบันทึก'),
                  ),
                  if (_hasActiveKey) ...[
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: _busy ? null : _cancelEditing,
                      child: const Text('ยกเลิก'),
                    ),
                  ],
                ],
                if (_editing && settings.hasKey) ...[
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
