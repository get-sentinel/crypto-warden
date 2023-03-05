import { useNavigation } from "@react-navigation/native";
import React from "react"
import { Image, StyleSheet } from "react-native";
import Onboarding from 'react-native-onboarding-swiper';
import ONBOARDING1 from '../assets/onboarding/onboarding1.png'
import ONBOARDING2 from '../assets/onboarding/onboarding2.png'
import ONBOARDING3 from '../assets/onboarding/onboarding3.png'
import ONBOARDING4 from '../assets/onboarding/onboarding4.png'
import StableSafeArea from "../components/safeArea/StableSafeArea";

const OnboardingCarousel = () => {
    const navigation = useNavigation<any>();

    const onboardingPages = [
        {
            backgroundColor: '#fff',
            image: <Image style={styles().image} source={ONBOARDING1} />,
            title: 'Create a wallet',
            subtitle: 'Use your favorite wallet provider to create a wallet.',
        },
        {
            backgroundColor: '#fff',
            image: <Image style={styles().image} source={ONBOARDING2} />,
            title: 'Copy the seed phrase',
            subtitle: 'Take the newly generated 12-24 seed phrase and save it in Crypto Warden.',
        },
        {
            backgroundColor: '#fff',
            image: <Image style={styles().image} source={ONBOARDING3} />,
            title: 'Safe in your personal Keychain',
            subtitle: 'Crypto Warden will save your seed phrase in your personal Apple iCloud Keychain, NOT in our server.',
        },
        {
            backgroundColor: '#fff',
            image: <Image style={styles().image} source={ONBOARDING4} />,
            title: 'Need to reactivate your wallet?',
            subtitle: 'Open Crypto Warden and copy your saved seed phrase to restore your wallet.',
        }
    ]

    return <StableSafeArea>
        <Onboarding
            imageContainerStyles={{ flex: 1 }}
            containerStyles={{ padding: 0, margin: 0, backgroundColor: '#fff',  }}
            titleStyles={{ padding: 0, margin: 0, fontSize: 24, fontWeight: '500' }}
            subTitleStyles={{ padding: 0, margin: 0, marginBottom: 170, }}
            onDone={() => navigation.goBack()}
            onSkip={() => navigation.goBack()}
            pages={onboardingPages}
            bottomBarColor='#fff'
        />
    </StableSafeArea>
}

export default OnboardingCarousel

const styles = () => {

    return StyleSheet.create({
        image: {
            resizeMode: 'contain',
            height: '100%',
            width: '100%'
        }
    })
}