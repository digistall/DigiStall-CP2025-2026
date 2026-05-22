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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    position: 'absolute',
    top: 60,
    textAlign: 'center',
  },
  subHeaderText: {
    color: '#DDD',
    fontSize: 16,
    position: 'absolute',
    top: 100,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  guideCircle: {
    width: circleSize,
    height: circleSize * 1.3,
    borderRadius: circleSize,
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  guideCircleZoomOut: {
    width: circleSize,
    height: circleSize * 1.5,
    borderRadius: circleSize,
    borderWidth: 3,
    borderColor: '#2196F3',
    backgroundColor: 'transparent',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
  },
  captureText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 14,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#666',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Loading
  loadingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 15,
    fontSize: 16,
  }
});
