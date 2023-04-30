import React, { useEffect, useState } from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
    Image,
    TouchableOpacity,
} from 'react-native';
import {
    Colors,
} from 'react-native/Libraries/NewAppScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Wallet from '../class/Wallet';
import { getNextSorting, sortWallets } from '../utils/utils';
import { Button, useTheme } from '@ui-kitten/components';
import WalletCell from '../components/cells/WalletCell';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedWallet } from '../redux/WalletSlice';
import { useNavigation } from '@react-navigation/native';
import { BUTTON_FONT_SIZE, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN, DEFAULT_CORNER_RADIUS, DEFAULT_PADDING, PAGES, TOAST_POSITION, TOP_NAV_TITLE_SIZE, TOP_NAV_TITLE_WEIGHT } from '../utils/constants';
import { fetchWallets } from '../storage/KeychainManager';
import { RefreshControl } from 'react-native-gesture-handler';
import StableSafeArea from '../components/safeArea/StableSafeArea';
import DEFAULT_IMAGE from '../assets/onboarding/onboarding1.png'
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { setAuthenticated, setPremium, setSentinelPremium, setUID } from '../redux/AccountSlice';
import auth from '@react-native-firebase/auth';
import { checkPremium } from '../iap/PurchaseIAP';
import Toast from 'react-native-toast-message';

const revenueCatConfig = require('../revenueCatConfig/revenueCatConfig.json')

const Home = () => {

    const isDarkMode = useColorScheme() === 'dark';
    const wallets = useSelector((state: any) => state.walletSlice.wallets);
    const premium = useSelector((state: any) => state.accountSlice.premium);
    const [sortedWallets, setSortedWallets] = useState<Wallet[]>([]);
    const dispatch = useDispatch()
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sorting, setSorting] = useState(0);
    const [sortingImage, setSortingImage] = useState('sort-calendar-ascending')

    useEffect(() => {
        const connectRevenueCat = async () => {

            try {
                if (Platform.OS === 'ios') {
                    await Purchases.configure({ apiKey: revenueCatConfig.apple_api_key });
                } else if (Platform.OS === 'android') {
                    // TODO
                }
            }
            catch (e) {
                console.log(e)
            }
        }

        connectRevenueCat()
        checkPremium(dispatch)

        const subscribeFirebase = () => {
            return auth().onAuthStateChanged(async user => {
                if (user) {
                    dispatch(setAuthenticated(true))
                    dispatch(setUID(user.uid))
                    await Purchases.logIn(user.uid);
                } else {
                    dispatch(setAuthenticated(false))
                    dispatch(setUID(undefined))
                }
            });
        }

        const unsubscribe = subscribeFirebase()

        return () => {
            unsubscribe()
        };

    }, [])

    useEffect(() => {
        switch (sorting) {
            case 0:
            default:
                setSortingImage('sort-calendar-ascending')
                break
            case 1:
                setSortingImage('sort-calendar-descending')
                break
            case 2:
                setSortingImage('sort-alphabetical-ascending')
                break
            case 3:
                setSortingImage('sort-alphabetical-descending')
                break

        }
        setSortedWallets(sortWallets(wallets, sorting))
    }, [sorting, wallets])

    useEffect(() => {
        fetchWallets({ dispatch: dispatch, synchronizable: premium })
    }, [premium])


    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };

    const renderItem = ({ item, index }: { item: Wallet, index: any }) => (
        <WalletCell
            item={item}
            shouldDisplayDivider={index !== wallets.length - 1}
            onPress={() => {
                dispatch(setSelectedWallet(item))
                navigation.navigate(PAGES.WALLET_DETAILS)
            }}
        />
    );

    const refreshWallets = () => {
        setIsRefreshing(true)
        fetchWallets({ dispatch: dispatch, synchronizable: premium })
        setIsRefreshing(false)
    }



    const addNewWallet = () => {
        if (premium || wallets.length < 1) {
            navigation.navigate(PAGES.ADD)
        } else {
            navigation.navigate(PAGES.PAYWALL)
        }
    }

    const syncData = () => {
        fetchWallets({ dispatch: dispatch, synchronizable: premium })

        if (!premium) {
            Toast.show({
                type: 'success',
                position: TOAST_POSITION,
                text1: 'Upgrade required',
                text2: 'Sync is available only to Premium users',
                visibilityTime: 2000,
                autoHide: true,
                topOffset: 30,
                bottomOffset: 40,
                onShow: () => { },
                onHide: () => { },
                onPress: () => { },
                props: { iconName: 'alert' }
            })
        }
    }

    return (
        <>
            <StableSafeArea>
                <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                    backgroundColor={backgroundStyle.backgroundColor}
                />

                <View style={{
                    padding: DEFAULT_PADDING,
                    backgroundColor: theme['color-basic-500'],
                    flex: 1
                }}>

                    <View style={styles.toolbar}>

                        <View style={styles.toolbar}>
                            <TouchableOpacity
                                style={{ ...styles.actionButton, ...{ backgroundColor: 'transparent', marginRight: DEFAULT_1x_MARGIN } }}
                                onPress={() => navigation.navigate(PAGES.SETTINGS)}>
                                <MaterialCommunityIcons name={'account-cog-outline'} size={27} color={theme['unselected-icon-color']} />
                            </TouchableOpacity>

                            {!premium
                                ? <TouchableOpacity
                                    style={{ ...styles.actionButton, ...{ backgroundColor: 'rgb(238, 205, 95)' } }}
                                    onPress={() => navigation.navigate(PAGES.PAYWALL)}>
                                    <MaterialCommunityIcons name={'crown'} size={20} color={theme['fab-text-color']} />
                                </TouchableOpacity>
                                : undefined
                            }
                        </View>

                        <View style={styles.toolbar}>
                            <TouchableOpacity
                                style={{ ...styles.actionButton, ...{ backgroundColor: 'transparent', marginRight: DEFAULT_1x_MARGIN } }}
                                onPress={() => setSorting(getNextSorting(sorting))}>
                                <MaterialCommunityIcons name={sortingImage} size={27} color={theme['unselected-icon-color']} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ ...styles.actionButton, ...{ backgroundColor: theme['color-primary-500'] } }}
                                onPress={() => addNewWallet()}>
                                <MaterialCommunityIcons name={'plus'} size={20} color={theme['fab-text-color']} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={{
                        fontWeight: TOP_NAV_TITLE_WEIGHT,
                        fontSize: TOP_NAV_TITLE_SIZE,
                        color: theme['icon-basic-color'],
                        marginTop: DEFAULT_2x_MARGIN
                    }}>
                        {'Crypto Warden'}
                    </Text>

                    {
                        sortedWallets.length > 0
                            ? <FlatList
                                data={sortedWallets.filter(wallet => !wallet.isDeleted)}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={isRefreshing}
                                        onRefresh={() => refreshWallets()}
                                    />
                                }
                                contentContainerStyle={{
                                    borderWidth: 1,
                                    borderColor: theme['color-basic-300'],
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    backgroundColor: theme['color-basic-600'],

                                }}
                                showsVerticalScrollIndicator={false}
                                style={{ marginTop: DEFAULT_3x_MARGIN }}
                                renderItem={renderItem}
                                keyExtractor={item => item.seed}
                            />
                            :
                            <View style={{ display: 'flex', height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                <TouchableOpacity
                                    style={{ borderRadius: DEFAULT_CORNER_RADIUS, backgroundColor: theme['background-color-button'], padding: 10, marginBottom: DEFAULT_3x_MARGIN }}
                                    onPress={() => syncData()}>
                                    <Text style={{ color: theme['text-primary-color-button'], fontWeight: '400', fontSize: 16 }}>
                                        {'Press to sync data'}
                                    </Text>
                                </TouchableOpacity>
                                <Image source={DEFAULT_IMAGE} style={{ width: '100%', maxHeight: '50%', overflow: 'visible' }} />

                            </View>
                    }
                </View>
            </StableSafeArea>

        </>
    )
}

const styles = StyleSheet.create({
    walletCell: {
        height: 60,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 10
    },
    walletIcon: {
        width: 35,
        height: 35,
        borderRadius: 6,
        marginRight: 10
    },
    walletProvider: {
        fontSize: 16,
        fontWeight: '500'
    },
    walletName: {
        fontSize: 14,
    },
    toolbar: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionButton: {
        borderRadius: 100,
        height: 35,
        width: 35,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }
})

export default Home

