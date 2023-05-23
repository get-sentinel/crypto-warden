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
import { isSmallScreen, openURL } from "../utils/utils";
import Purchases from "react-native-purchases";
import { getLifetimeIAPDetails, purchaseIAP } from "../iap/PurchaseIAP";
import PaywallCell from "../components/cells/PaywallCell";
import PaywallFeatureCell from "../components/cells/PaywallFeatureCell";
import ICON from '../assets/app-icon.png';
import PageTitle from "../components/PageTitle";

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


        <View
            style={{
                backgroundColor: theme['color-basic-500'],
                borderColor: 'transparent',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                paddingBottom: isSmallScreen() ? 15 : 50,
                paddingTop: 15,
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

            <View style={{ height: 55, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: DEFAULT_2x_MARGIN }}>
                <Text style={{ fontSize: 32, fontWeight: '700', color: theme['text-basic-color'] }}> Crypto Warden </Text>
                <View style={{ padding: 4, backgroundColor: 'rgb(249,222,82)', borderRadius: DEFAULT_CORNER_RADIUS }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: 'rgb(34,52,45)' }}> Plus </Text>
                </View>
            </View>

            <Image
                source={ICON}
                style={{ width: 100, height: 100, borderRadius: 10, alignSelf: 'center' }}
            />

            <Text style={{ fontSize: 16, fontWeight: '400', color: theme['text-basic-color'], textAlign:'center', marginTop:DEFAULT_3x_MARGIN }}>Purchase Crypto Warden Plus to enjoy a beautiful Dark Mode and support the Open Source Project.</Text>

            <View
                style={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: 0, flex: 1
                }}>


                <PaywallFeatureCell
                    featureTitle="Dark Mode"
                    featureDescription="Enjoy beautiful dark mode for Crypto Warden."
                />

                {/* <Divider style={styles().divider} /> */}

                <PaywallFeatureCell
                    featureTitle="Support Open Source project"
                    featureDescription="This purchase will support us and help us grow. Thank you for that."
                />

            </View>

            <View style={{
                justifyContent: 'space-between',
                paddingHorizontal: DEFAULT_1x_MARGIN,
                marginTop: DEFAULT_3x_MARGIN,
                width: '100%',
                backgroundColor: theme['color-basic-600'],
                borderRadius: DEFAULT_CORNER_RADIUS,
            }}>

                {/* <PaywallCell
                    paywallOption="One-Time"
                    paywallOptionDescription="Pay once, enjoy forever."
                    paywallOptionPrice={`${lifetimePrice === '' ? '$ 5.99' : lifetimePrice}`}
                    selected={true}
                    onPress={() => console.log()}
                /> */}

            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: DEFAULT_2x_MARGIN }}>
                <Text style={{ color: theme['secondary-text'], fontSize: 12 }}>
                    {'By purchasing you agree to the '}
                    <Text style={{ color: theme['color-primary-500'], fontSize: 12 }}
                        onPress={() => openURL('https://getsentinel.io/terms-of-service?ref=app')}>
                        Terms of Service
                    </Text>
                    {' and '}
                    <Text style={{ color: theme['color-primary-500'], fontSize: 12 }}
                        onPress={() => openURL('https://getsentinel.io/privacy-policy?ref=app')}>
                        Privacy Policy
                    </Text>
                    {'.'}
                </Text>
            </View>

            <Button
                style={{ width: '100%', marginBottom: 0, marginTop: DEFAULT_1x_MARGIN, backgroundColor: theme['background-color-button'], borderWidth: 0, borderRadius: DEFAULT_CORNER_RADIUS, height: 50 }}
                onPress={() => purchase()}>
                {props => <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 10, paddingVertical: 0 }}>
                    <Text {...props} style={{ color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE, padding: 0 }}>
                        {`Purchase for just`}
                    </Text>
                    <Text {...props} style={{
                        color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE, padding: 0, textDecorationLine: discountedLifetimePrice ? 'line-through' : undefined,
                        textDecorationStyle: 'solid',
                    }}>
                        {` ${lifetimePrice} `}
                    </Text>
                    {discountedLifetimePrice
                        ? <Text {...props} style={{ color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE, padding: 0 }}>
                            {` ${discountedLifetimePrice}`}
                        </Text>
                        : undefined
                    }
                </View>
                }
            </Button >

        </View >
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