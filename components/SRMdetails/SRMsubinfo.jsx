import { View, Linking, StyleSheet } from 'react-native';
import React from 'react';
import SRMSubinfoCard from './SRMSubinfoCard';
import { useTheme } from '../../context/ThemeContext';

export default function SRMsubinfo({ SRM }) {
  const { colors, isDarkMode } = useTheme();
  console.log("Firestore price value:", SRM?.price); // 🔍 Debugging Firestore price

  // Function to open WhatsApp
  const openWhatsApp = () => {
    if (SRM?.whatsappNo) {
      const phoneNumber = SRM.whatsappNo.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}`;

      Linking.openURL(whatsappUrl).catch(err => 
        console.error("❌ Failed to open WhatsApp:", err)
      );
    }
  };

  // Function to format price
  const formatPrice = (price) => {
    if (!price || isNaN(price) || price === "") return 'Free'; 
    return price == 0 ? 'Free' : `₹${price}`;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SRMSubinfoCard 
          icon={require('./../../assets/images/instagram-icon.png')}
          title={'Instagram'}
          value={SRM?.Insta}
          onPress={() => {
            if (SRM?.Insta) {
              const instaUsername = SRM.Insta.replace('@', ''); 
              const instagramUrl = `https://www.instagram.com/${instaUsername}/`;
              Linking.openURL(instagramUrl).catch(err => 
                console.error("❌ Failed to open Instagram:", err)
              );
            }
          }}
          themeColors={colors}
          isDarkMode={isDarkMode}
        />
        <SRMSubinfoCard 
          icon={require('./../../assets/images/calender1.png')}
          title={'Event Date'}
          value={SRM?.Time}
          themeColors={colors}
          isDarkMode={isDarkMode}
        />
      </View>
      <View style={styles.row}>
        <SRMSubinfoCard 
          icon={require('./../../assets/images/gmail.png')}
          title={'Email'}
          value={SRM?.Mail}
          onPress={() => {
            if (SRM?.Mail) {
              const emailUrl = `mailto:${SRM.Mail}`;
              Linking.openURL(emailUrl).catch(err => 
                console.error("❌ Failed to open Email App:", err)
              );
            }
          }}
          themeColors={colors}
          isDarkMode={isDarkMode}
        />
        <SRMSubinfoCard 
          icon={require('./../../assets/images/whatsapp-icon.png')}
          title={'WhatsApp'}
          value={SRM?.whatsappNo}
          onPress={openWhatsApp}
          themeColors={colors}
          isDarkMode={isDarkMode}
        />
      </View>
      <View style={styles.row}>
      <SRMSubinfoCard
       
  icon={require('./../../assets/images/price-tag.webp')}
  title={'Price'}
  value={formatPrice(SRM?.price)} // Ensure it's properly formatted
  highlighted={true}
  themeColors={colors}
  isDarkMode={isDarkMode}
/>

        {SRM?.Location && (
          <SRMSubinfoCard 
            icon={require('./../../assets/images/location-pin.png')}
            title={'Location'}
            value={SRM?.Location}
            themeColors={colors}
            isDarkMode={isDarkMode}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  }
});