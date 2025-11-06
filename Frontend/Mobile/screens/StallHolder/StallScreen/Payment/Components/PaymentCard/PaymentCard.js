import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  ImageBackground,
} from "react-native";
import { styles } from "./PaymentCardStyles";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75 + 12;

const PaymentCard = ({ onPaymentMethodSelect, onProceedPayment }) => {
  const [selectedCard, setSelectedCard] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const paymentMethods = [
    {
      id: "gcash",
      name: "GCash",
      type: "E-Wallet",
      color: "#007DFE",
      backgroundColor: "#E8F4FD",
      gradientColors: ["#007DFE", "#0056D6"],
      description: "Pay with your GCash wallet",
      logo: require("../../../../../../assets/gcash-logo.png"),
      backgroundImage: require("../../../../../../assets/gcash-logo.png"),
    },
    {
      id: "paymaya",
      name: "PayMaya",
      type: "E-Wallet",
      color: "#00D632",
      backgroundColor: "#E8F8ED",
      gradientColors: ["#00D632", "#00A827"],
      description: "Pay with your PayMaya account",
      logo: require("../../../../../../assets/pay-maya-logo.png"),
      backgroundImage: require("../../../../../../assets/pay-maya-logo.png"),
    },
    {
      id: "bank",
      name: "Bank Transfer",
      type: "Bank Account",
      color: "#FF6B35",
      backgroundColor: "#FFF2E6",
      gradientColors: ["#FF6B35", "#E55A2B"],
      description: "Pay via bank transfer",
      logo: require("../../../../../../assets/bank-image.png"),
      backgroundImage: require("../../../../../../assets/bank-image.png"),
    },
  ];

  const handleCardPress = (index, method) => {
    setSelectedCard(index);
    // Scroll to the selected card
    scrollViewRef.current?.scrollTo({
      x: index * CARD_WIDTH,
      animated: true,
    });
    if (onPaymentMethodSelect) {
      onPaymentMethodSelect(method);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(offsetX / CARD_WIDTH);
        if (
          currentIndex !== selectedCard &&
          currentIndex >= 0 &&
          currentIndex < paymentMethods.length
        ) {
          setSelectedCard(currentIndex);
          if (onPaymentMethodSelect) {
            onPaymentMethodSelect(paymentMethods[currentIndex]);
          }
        }
      },
    }
  );

  const renderPaymentCard = (method, index) => {
    const isSelected = selectedCard === index;

    return (
      <TouchableOpacity
        key={method.id}
        onPress={() => handleCardPress(index, method)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.paymentCard,
            { backgroundColor: method.backgroundColor },
            isSelected && [styles.selectedCard, { borderColor: method.color }],
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: method.logo ? "transparent" : method.color },
              ]}
            >
              {method.logo ? (
                <Image
                  source={method.logo}
                  style={styles.cardIconImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.cardIconText}>{method.name.charAt(0)}</Text>
              )}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{method.name}</Text>
              <Text style={styles.cardType}>{method.type}</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>{method.description}</Text>

          <View style={styles.cardFooter}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: method.color },
              ]}
            >
              <Text style={styles.statusText}>Available</Text>
            </View>
          </View>

          {isSelected && (
            <View
              style={[
                styles.selectionIndicator,
                { backgroundColor: method.color },
              ]}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAnimatedIndicators = () => {
    return paymentMethods.map((_, index) => {
      const inputRange = [
        (index - 1) * CARD_WIDTH,
        index * CARD_WIDTH,
        (index + 1) * CARD_WIDTH,
      ];

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [1, 1.5, 1],
        extrapolate: "clamp",
      });

      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.3, 1, 0.3],
        extrapolate: "clamp",
      });

      // Dynamic indicator color based on selected payment method
      const backgroundColor = scrollX.interpolate({
        inputRange,
        outputRange: [
          "#D1D5DB",
          paymentMethods[index]?.color || "#007AFF",
          "#D1D5DB",
        ],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.indicator,
            {
              transform: [{ scale }],
              opacity,
              backgroundColor,
            },
          ]}
        />
      );
    });
  };

  const handleProceedPress = () => {
    if (onProceedPayment) {
      onProceedPayment(paymentMethods[selectedCard]);
    }
  };

  // Determine which background image to use based on selected card
  const getBackgroundImage = () => {
    const selectedMethod = paymentMethods[selectedCard];
    return selectedMethod?.backgroundImage || null;
  };

  const backgroundImage = getBackgroundImage();
  const WrapperComponent = backgroundImage ? ImageBackground : View;
  const wrapperProps = backgroundImage
    ? {
        source: backgroundImage,
        style: styles.mainContainer,
        imageStyle: styles.mainBackgroundImage,
        resizeMode: "cover",
      }
    : {
        style: styles.mainContainer,
      };

  return (
    <WrapperComponent {...wrapperProps}>
      {/* Semi-transparent overlay for better visibility */}
      {backgroundImage && <View style={styles.mainOverlay} />}

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          snapToInterval={CARD_WIDTH}
          decelerationRate="fast"
          snapToAlignment="start"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          pagingEnabled={false}
        >
          {paymentMethods.map((method, index) =>
            renderPaymentCard(method, index)
          )}
        </Animated.ScrollView>

        <View style={styles.indicatorContainer}>
          {renderAnimatedIndicators()}
        </View>

        {/* Proceed with Payment Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={handleProceedPress}
            activeOpacity={0.8}
          >
            <Text style={styles.proceedButtonText}>Proceed with Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </WrapperComponent>
  );
};

export default PaymentCard;
