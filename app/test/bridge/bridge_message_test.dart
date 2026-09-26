import 'package:flutter_test/flutter_test.dart';
import 'package:ngern_pai_nai/bridge/bridge_message.dart';

void main() {
  group('BridgeRequest', () {
    test('keeps the correlation ID and typed operation', () {
      final request = BridgeRequest.fromJson({
        'id': 'request-42',
        'operation': 'transactions.delete',
        'payload': {'id': 'tx-9'},
      });

      expect(request.id, 'request-42');
      expect(request.operation, 'transactions.delete');
      expect(request.payload, {'id': 'tx-9'});
    });

    test('rejects malformed requests before they reach a service', () {
      expect(
        () => BridgeRequest.fromJson({'operation': 'transactions.list'}),
        throwsFormatException,
      );
    });
  });

  test('failure responses include only a stable code and safe message', () {
    const response = BridgeResponse.failure(
      id: 'request-42',
      error: BridgeError(code: 'UNEXPECTED', message: 'Please try again.'),
    );

    expect(response.toJson(), {
      'id': 'request-42',
      'ok': false,
      'error': {'code': 'UNEXPECTED', 'message': 'Please try again.'},
    });
  });

  test('failure responses can include structured recovery data', () {
    const response = BridgeResponse.failure(
      id: 'request-duplicate',
      error: BridgeError(
        code: 'RECEIPT_DUPLICATE',
        message: 'พบรายการซ้ำ',
        data: {'id': 'tx-existing'},
      ),
    );

    expect(
      response.toJson()['error'],
      containsPair('data', {'id': 'tx-existing'}),
    );
  });
}
