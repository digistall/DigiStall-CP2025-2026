import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const circleSize = width * 0.7;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },

  // ──────────────────────────────────────────────
  // WHITE LIGHTING MASK  –  sits directly on top of the camera.
  // A huge white border around a transparent oval hole creates a
  // solid-white surround that acts as a front-fill light source.
  // ──────────────────────────────────────────────
  maskContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  maskCircle: {
    width: circleSize + 2000,
    height: (circleSize * 1.3) + 2000,
    borderRadius: (circleSize + 2000) / 2,
    borderWidth: 1000,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  maskCircleZoomOut: {
    width: (circleSize * 0.8) + 2000,
    height: (circleSize * 1.05) + 2000,
    borderRadius: ((circleSize * 0.8) + 2000) / 2,
    borderWidth: 1000,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },

  // ──────────────────────────────────────────────
  // UI OVERLAY  –  fully transparent so the white mask shows through.
  // Contains text labels, guide border, scan line, buttons.
  // ──────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  headerText: {
    color: '#1B5E20',
    fontSize: 22,
    fontWeight: 'bold',
    position: 'absolute',
    top: 55,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subHeaderText: {
    color: '#4A5568',
    fontSize: 14,
    position: 'absolute',
    top: 86,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ──────────────────────────────────────────────
  // GUIDE CIRCLES – a visible oval border the user aligns with.
  // Matches the reference image: thick dark-green stroke.
  // ──────────────────────────────────────────────
  guideCircle: {
    width: circleSize,
    height: circleSize * 1.3,
    borderRadius: circleSize,
    borderWidth: 4,
    borderColor: '#2E7D32',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'absolute',
  },
  guideCircleZoomOut: {
    width: circleSize * 0.8,
    height: circleSize * 1.05,
    borderRadius: circleSize * 0.8,
    borderWidth: 4,
    borderColor: '#1565C0',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'absolute',
  },

  // Controls & Shutter Buttons
  btnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 20,
  },
  startScanButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    marginRight: 15,
  },
  startScanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  manualCaptureButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1B3A4B',
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 130,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scanningStatusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  holdStillText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },

  // Preview Screen
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 30,
    backgroundColor: 'rgba(10,10,12,0.9)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#3A3A3C',
  },
  confirmButton: {
    backgroundColor: '#2E7D32',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Loading overlay
  loadingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,12,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },

  // Premium Custom Alert
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: width * 0.85,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: '#EBEBF5',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  alertButton: {
    paddingVertical: 14,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  alertButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Countdown overlay centered
  countdownContainer: {
    position: 'absolute',
    top: height / 2 - 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 88,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  capturingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginTop: 20,
  },
});
