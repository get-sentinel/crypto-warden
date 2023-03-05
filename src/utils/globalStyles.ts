import { StyleSheet } from "react-native"

const RADIUS = 5

export const globalStyles = (theme: Record<string, string>) => StyleSheet.create({
    primaryButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '35%',
        backgroundColor: theme['background-color-button'],
        borderRadius: RADIUS,
        marginTop: 0,
        borderWidth: 0,
        paddingVertical: 10
    },
    cancelButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        width: '35%',
        backgroundColor: theme['color-basic-800'],
        borderRadius: RADIUS,
        marginTop: 0,
        borderWidth: 1,
        borderColor: theme['color-basic-300'],
        paddingVertical: 10,
    }
})
