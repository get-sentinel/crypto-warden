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
            title: 'What is Crypto Warden?',
            subtitle: 'It\'s an app that allows you to securely store your crypto wallet seed/backup phrases to avoid losing them.',
        },
        {
            backgroundColor: '#fff',
            image: <Image style={styles().image} source={ONBOARDING2} />,
            title: 'Create a new wallet',
            subtitle: 'Once the wallet provider (e.g. Metamask) gives you the 12 words phrase save it in Crypto Warden.',
        },
        {
            backgroundColor: '#fff',
            image: <Image style={styles().image} source={ONBOARDING3} />,
            title: 'Choose your Security Configuration',
            subtitle: 'All solutions we offer are encrypted and secure. Check our Security Model for more details.',
        },
        {
            backgroundColor: '#fff',
            image: <Image style={styles().image} source={ONBOARDING4} />,
            title: 'Need to reactivate your wallet?',
            subtitle: 'Open Crypto Warden and tap to copy your seed phrase to restore your wallet.',
        }
    ]

    return <StableSafeArea bg='#fff'>
        <Onboarding
            imageContainerStyles={{ flex: 1 }}
            containerStyles={{ padding: 0, margin: 0, backgroundColor: '#fff', }}
            titleStyles={{ padding: 0, margin: 0, fontSize: 24, fontWeight: '500' }}
            subTitleStyles={{ padding: 0, margin: 0, marginBottom: 80, }}
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