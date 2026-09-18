class BridgeRequest {
  const BridgeRequest({
    required this.id,
    required this.operation,
    required this.payload,
  });

  factory BridgeRequest.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final operation = json['operation'];
    final payload = json['payload'];
    if (id is! String ||
        id.isEmpty ||
        operation is! String ||
        payload is! Map) {
      throw const FormatException('Invalid bridge request.');
    }
    return BridgeRequest(
      id: id,
      operation: operation,
      payload: Map<String, dynamic>.from(payload),
    );
  }

  final String id;
  final String operation;
  final Map<String, dynamic> payload;
}

class BridgeResponse {
  const BridgeResponse.success({required this.id, required this.data})
    : ok = true,
      error = null;

  const BridgeResponse.failure({required this.id, required this.error})
    : ok = false,
      data = null;

  final Object? data;
  final BridgeError? error;
  final String id;
  final bool ok;

  Map<String, dynamic> toJson() => {
    'id': id,
    'ok': ok,
    if (ok) 'data': data else 'error': error!.toJson(),
  };
}

class BridgeError {
  const BridgeError({required this.code, required this.message});

  final String code;
  final String message;

  Map<String, dynamic> toJson() => {'code': code, 'message': message};
}
