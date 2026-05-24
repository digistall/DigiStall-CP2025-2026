import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// ID Card dimensions based on aspect ratio
const cardWidth = width * 0.86;
const cardHeight = cardWidth * 0.63; // Standard card aspect ratio (approx 1.58:1)
const maskBg = 'rgba(0, 0, 0, 0.75)'; // Dark semi-transparent background

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  shutterFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    zIndex: 99,
  },

  // ──────────────────────────────────────────────
  // RECTANGULAR CARD MASK LAYER
  // ──────────────────────────────────────────────
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  maskTop: {
    flex: 1,
    backgroundColor: maskBg,
  },
  maskMiddleRow: {
    height: cardHeight,
    flexDirection: 'row',
  },
  maskLeft: {
    flex: 1,
    backgroundColor: maskBg,
  },
  maskRight: {
    flex: 1,
    backgroundColor: maskBg,
  },
  maskBottom: {
    flex: 1,
    backgroundColor: maskBg,
  },

  // Centered transparent cutout window
  cutoutWindow: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: 'transparent',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Corner bracket guides for centering
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#2ECC71', // Bright green for guide contrast
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },

  idCardGhost: {
    opacity: 0.6,
  },

  // ──────────────────────────────────────────────
  // UI OVERLAY
  // ──────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  headerText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    position: 'absolute',
    top: 55,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subHeaderText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    position: 'absolute',
    top: 88,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Controls & Buttons
  btnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 20,
    minHeight: 52,
  },
  startScanButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  startScanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 130,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Custom Alert Modal
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: '#EBEBF5',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  alertButton: {
    paddingVertical: 12,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ──────────────────────────────────────────────
  // PREVIEW SCREEN STYLES (MATCHES FACE SCANNER)
  // ──────────────────────────────────────────────
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
    zIndex: 4,
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
    backgroundColor: '#2ECC71',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Loading overlay
  loadingContainer: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
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
});
