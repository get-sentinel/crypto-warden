import { NavigationContainer, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, ImageBackground, Linking, NativeModules, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import {
    Button,
    Text,
    useTheme, Spinner, Divider, TopNavigation
} from '@ui-kitten/components';
import { useDispatch, useSelector } from "react-redux";
import ModalContainer from "../components/ModalContainer";
import { BUTTON_FONT_SIZE, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN, DEFAULT_CORNER_RADIUS, DEFAULT_PADDING } from "../utils/constants";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { openURL } from "../utils/utils";
import Purchases from "react-native-purchases";
import { getLifetimeIAPDetails, purchaseIAP } from "../iap/PurchaseIAP";
import PaywallCell from "../components/cells/PaywallCell";
import PaywallFeatureCell from "../components/cells/PaywallFeatureCell";
import PREMIUM from '../assets/premium.png';
import PageTitle from "../components/PageTitle";
import StableSafeArea from "../components/safeArea/StableSafeArea";

const Paywall = React.memo(() => {

    const theme = useTheme();
    const dispatch = useDispatch()
    const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
    const [lifetimePrice, setLifetimePrice] = useState('$4,99');
    const [discountedLifetimePrice, setDiscountedLifetimePrice] = useState<string | undefined>(undefined);
    const navigation = useNavigation()
    const sentinelPremium = useSelector((state: any) => state.accountSlice.sentinelPremium);
    const uid = useSelector((state: any) => state.accountSlice.uid);
    const wallets = useSelector((state: any) => state.walletSlice.wallets);

    useEffect(() => {
        getLifetimeIAPDetails()
            .then(product => {
                if (product) {
                    setLifetimePrice(product.priceString)
                }
            })
    }, [])

    useEffect(() => {
        if (sentinelPremium) {
            getLifetimeIAPDetails(true)
                .then(product => {
                    if (product) {
                        setDiscountedLifetimePrice(product.priceString)
                    }
                })
                .catch(e => console.log(e))
        }
    }, [sentinelPremium])

    const purchase = async () => {
        setIsProcessingPurchase(true)
        await purchaseIAP(dispatch, sentinelPremium, uid, wallets)
        setIsProcessingPurchase(false)
        navigation.goBack()
    }

    const goBack = () => {
        navigation.goBack()
    }

    const renderTitle = (props: any) => (
        <PageTitle title='' props={props} goBack={goBack} />
    );

    return (


        <StableSafeArea>

            <TopNavigation
                style={{
                    backgroundColor: theme['color-basic-500'],
                    paddingLeft: DEFAULT_PADDING,
                    paddingRight: DEFAULT_PADDING
                }}
                title={renderTitle}
            />

            <View
                style={{
                    backgroundColor: theme['color-basic-500'],
                    borderColor: 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    paddingBottom: 100,
                    paddingHorizontal: DEFAULT_3x_MARGIN,
                }}
            >

                {
                    isProcessingPurchase
                        ? <View style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 120,
                            height: 120,
                            borderRadius: 10,
                            zIndex: 10,
                            backgroundColor: theme['color-basic-500'],
                            position: 'absolute',
                            alignSelf: 'center',
                            bottom: Dimensions.get("window").height / 2
                        }}>
                            <Text style={{ marginBottom: 15 }}> Processing ... </Text>
                            <Spinner size='giant' style={{ alignSelf: 'center', borderColor: theme['color-primary-500'] }} />
                        </View>
                        : undefined
                }

                {/* <ImageBackground source={PREMIUM} resizeMode="contain" style={{
                    flex: 1,
                    justifyContent: 'center',
                }}> */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: 50
                    }}>
                    <Image source={PREMIUM} style={{ width: '100%', height: 200 }} />

                    <Text style={{
                        color: theme['text-basic-color'], fontSize: 32, fontWeight: '700', marginBottom: DEFAULT_2x_MARGIN, textAlign: 'center', marginTop: DEFAULT_1x_MARGIN
                    }}>
                        {"Get Premium"}
                    </Text>

                    <Text style={{
                        color: theme['text-basic-color'], fontSize: 14, marginBottom: DEFAULT_3x_MARGIN, textAlign: 'center'
                    }}>
                        {"Get full protection, exclusive features and support us by upgrading to Crypto Warden Premium"}
                    </Text>


                    <View style={{ justifyContent: 'space-between', paddingHorizontal: DEFAULT_1x_MARGIN, width: '100%', backgroundColor: theme['color-basic-600'], borderRadius: DEFAULT_CORNER_RADIUS, borderWidth: 1, borderColor: theme['color-basic-300'] }}>

                        <PaywallCell
                            paywallOption="One-Time"
                            paywallOptionPrice="$5,99"
                            selected={true}
                            onPress={() => console.log()}
                        />

                    </View>

                    <View style={{ justifyContent: 'space-between', width: '100%', backgroundColor: theme['color-basic-600'], borderRadius: DEFAULT_CORNER_RADIUS, marginTop: DEFAULT_3x_MARGIN, borderWidth: 1, borderColor: theme['color-basic-300'] }}>

                        <PaywallFeatureCell
                            headingIcon="wallet"
                            featureTitle="Unlimited Wallets"
                            featureDescription="Add all your non-custodial wallets"
                            iconBackgroundColor={'rgb(72, 66, 245)'}
                        />

                        <Divider style={styles().divider} />

                        <PaywallFeatureCell
                            headingIcon="cellphone-link"
                            featureTitle="iCloud Keychain Sharing"
                            featureDescription="Secure sharing across all your devices"
                            iconBackgroundColor={'rgb(93, 66, 245)'}
                        />

                        <Divider style={styles().divider} />

                        <PaywallFeatureCell
                            headingIcon="account"
                            featureTitle="Support us"
                            featureDescription="Support the Open Source project"
                            iconBackgroundColor={'rgb(117, 66, 245)'}
                        />

                        <Divider style={styles().divider} />

                        <PaywallFeatureCell
                            headingIcon="application-brackets-outline"
                            featureTitle="All upcoming new features"
                            featureDescription="Enjoy all upcoming new features"
                            iconBackgroundColor={'rgb(150, 66, 245)'}
                        />

                    </View>

                    <View style={{ flexDirection: 'row', flex: 1, flexWrap: 'wrap', marginTop: DEFAULT_2x_MARGIN }}>
                        <Text style={{ color: theme['secondary-text'] }}>
                            {'By purchasing you agree to the '}
                            <Text style={{ color: theme['color-primary-500'] }}
                                onPress={() => openURL('https://getsentinel.io/terms-of-service?ref=app')}>
                                Terms of Service
                            </Text>
                            {' and '}
                            <Text style={{ color: theme['color-primary-500'] }}
                                onPress={() => openURL('https://getsentinel.io/privacy-policy?ref=app')}>
                                Privacy Policy
                            </Text>
                            {'.'}
                        </Text>
                    </View>

                </ScrollView>


                <Button
                    style={{ width: '100%', marginBottom: 0, marginTop: 20, backgroundColor: theme['background-color-button'], borderWidth: 0, borderRadius: DEFAULT_CORNER_RADIUS }}
                    onPress={() => purchase()}>
                    {props => <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 10, paddingVertical: 0 }}>
                        <Text {...props} style={{ color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE, padding: 0 }}>
                            {`Get Premium for`}
                        </Text>
                        <Text {...props} style={{
                            color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE, padding: 0, textDecorationLine: discountedLifetimePrice ? 'line-through' : undefined,
                            textDecorationStyle: 'solid',
                        }}>
                            {` ${lifetimePrice} `}
                        </Text>
                        {discountedLifetimePrice
                            ? <Text {...props} style={{ color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE, padding: 0 }}>
                                {` only ${discountedLifetimePrice}`}
                            </Text>
                            : undefined
                        }
                    </View>
                    }
                </Button>

            </View>
        </StableSafeArea>
    );
});

const styles = () => {
    const theme = useTheme()

    return StyleSheet.create({
        featureText: {
            marginLeft: 20,
            color: theme['color-basic-950'],
            textAlign: 'left',
            fontSize: 16,
            // lineHeight: 25,
            fontWeight: '400'
        },
        columnHeader: {
            color: theme['color-basic-950'],
            textAlign: 'center',
            fontSize: 18,
            // lineHeight: 25,
            fontWeight: '600',
        },
        featureView: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: 15,
            // height: 30,
            // backgroundColor:'#eee'
        },
        iconView: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme['color-primary-500'],
            borderRadius: 4,
            padding: 5
            // height: 30,
            // backgroundColor:'#eee'
        },
        checkIcon: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: 5,
            marginLeft: 20
        },
        textView: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            marginBottom: 5,
        },
        divider: {
            backgroundColor: theme['color-basic-300'],
            width: '90%',
            alignSelf: 'flex-end'
        },
    })
}


export default Paywall;