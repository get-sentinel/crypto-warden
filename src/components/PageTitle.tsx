/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import {
    Text, useTheme
} from '@ui-kitten/components';
import { TOP_NAV_TITLE_SIZE, HANDSET, TOP_NAV_TITLE_WEIGHT, DEFAULT_3x_MARGIN, DEFAULT_1x_MARGIN } from '../utils/constants';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const PageTitle = ({ title, props, goBack }: { title: string, props?: any, goBack?: () => void }) => {

    const theme = useTheme();

    return (
        <View style={styles(theme).titleContainer}>
            {
                goBack
                    ? <MaterialCommunityIcons {...props} color={theme['icon-basic-color']} style={{ paddingRight: DEFAULT_1x_MARGIN }} name='arrow-left' size={25} onPress={() => goBack()} />
                    : undefined
            }
            <Text {...props} style={styles(theme).titleText}>
                {title}
            </Text>
        </View>
    )

};

const styles = (theme: Record<string, string>) => StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleText: {
        fontWeight: TOP_NAV_TITLE_WEIGHT,
        fontSize: TOP_NAV_TITLE_SIZE,
        color: theme['icon-basic-color']
    }
});

export default PageTitle