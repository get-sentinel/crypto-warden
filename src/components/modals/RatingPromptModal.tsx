import React, { useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, useTheme } from '@ui-kitten/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNModal from 'react-native-modal';
import InAppReview from 'react-native-in-app-review';

import {
  APP_STORE_IOS_ID,
  DEFAULT_2x_MARGIN,
  DEFAULT_PADDING,
  PLAY_STORE_ANDROID_ID,
} from '../../utils/constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function RatingPromptModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const [requesting, setRequesting] = useState(false);

  const primary = theme['color-primary-500'];

  // Falls back to the store page if the native in-app review flow is
  // unavailable (e.g. older OS versions or the API isn't ready).
  const openStoreFallback = async () => {
    if (Platform.OS === 'ios') {
      const deepLink = `itms-apps://itunes.apple.com/app/id${APP_STORE_IOS_ID}?action=write-review`;
      const webFallback = `https://apps.apple.com/app/id${APP_STORE_IOS_ID}?action=write-review`;
      try {
        const canOpen = await Linking.canOpenURL(deepLink);
        await Linking.openURL(canOpen ? deepLink : webFallback);
      } catch {
        // ignore — user dismissal or no store available
      }
    } else {
      const marketUrl = `market://details?id=${PLAY_STORE_ANDROID_ID}`;
      const webFallback = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ANDROID_ID}`;
      try {
        const canOpen = await Linking.canOpenURL(marketUrl);
        await Linking.openURL(canOpen ? marketUrl : webFallback);
      } catch {
        // ignore
      }
    }
  };

  const handleRate = async () => {
    if (requesting) {
      return;
    }
    setRequesting(true);
    try {
      // Native StoreKit / Play In-App Review: the system shows its own
      // rating dialog and submits the rating directly to the store without
      // leaving the app. Apple/Google fully control whether it appears and
      // rate-limit it, so we can't know if the user actually rated.
      if (InAppReview.isAvailable()) {
        await InAppReview.RequestInAppReview();
      } else {
        await openStoreFallback();
      }
    } catch {
      await openStoreFallback();
    } finally {
      setRequesting(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setRequesting(false);
    onClose();
  };

  return (
    <RNModal
      isVisible={visible}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection="down"
      backdropOpacity={0.6}
      style={styles.modal}
    >
      <View style={[styles.sheet, { backgroundColor: theme['color-basic-modal-background'] }]}>
        <View style={[styles.handle, { backgroundColor: theme['transparency-basic-color'] }]} />

        <View style={[styles.heartCircle, { backgroundColor: primary + '1F' }]}>
          <MaterialCommunityIcons name="heart" size={32} color={primary} />
        </View>

        <Text style={[styles.title, { color: theme['text-basic-color'] }]}>
          Enjoying CryptoWarden?
        </Text>
        <Text style={[styles.subtitle, { color: theme['text-hint-color'] }]}>
          A quick rating helps other people discover the app. It only takes a second.
        </Text>

        <TouchableOpacity
          onPress={handleRate}
          disabled={requesting}
          activeOpacity={0.8}
          style={[styles.rateBtn, { backgroundColor: primary, opacity: requesting ? 0.6 : 1 }]}
        >
          <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
          <Text style={styles.rateText}>Rate CryptoWarden</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClose} style={styles.laterBtn} hitSlop={8}>
          <Text style={[styles.laterText, { color: theme['text-hint-color'] }]}>
            Maybe later
          </Text>
        </TouchableOpacity>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: DEFAULT_PADDING,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: DEFAULT_2x_MARGIN,
  },
  heartCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  rateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  laterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  laterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
