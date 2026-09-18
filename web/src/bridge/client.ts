import createMockBridge from './createMockBridge'
import createNativeBridge from './createNativeBridge'

const bridge = window.FlutterBridge ? createNativeBridge() : createMockBridge()

export default bridge

