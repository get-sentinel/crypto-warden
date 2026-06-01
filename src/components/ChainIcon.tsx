import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from '@ui-kitten/components';
import { ChainNetwork } from '../types/wallet.types';
import { CHAIN_NETWORK_META } from '../utils/constants';

const CHAIN_LOCAL_ICON: Partial<Record<ChainNetwork, ReturnType<typeof require>>> = {
  ethereum:  require('../assets/chains/ethereum.png'),
  bitcoin:   require('../assets/chains/bitocoin.png'),
  solana:    require('../assets/chains/solana.png'),
  polygon:   require('../assets/chains/polygon.png'),
  bnb:       require('../assets/chains/bnb.webp'),
  avalanche: require('../assets/chains/avalance.png'),
  arbitrum:  require('../assets/chains/arbitrum.png'),
  optimism:  require('../assets/chains/optimism.png'),
  cosmos:    require('../assets/chains/cosmos.png'),
  terra:     require('../assets/chains/terra.png'),
  sui:       require('../assets/chains/sui.png'),
  aptos:     require('../assets/chains/aptos.webp'),
  near:      require('../assets/chains/near.png'),
  tron:      require('../assets/chains/tron.png'),
  base:      require('../assets/chains/base.png'),
  fantom:    require('../assets/chains/fantom.png'),
};

const CHAIN_ABBREVIATION: Record<ChainNetwork, string> = {
  ethereum: 'ETH',
  bitcoin: 'BTC',
  solana: 'SOL',
  polygon: 'POL',
  bnb: 'BNB',
  avalanche: 'AVAX',
  arbitrum: 'ARB',
  optimism: 'OP',
  cosmos: 'ATOM',
  terra: 'LUNA',
  sui: 'SUI',
  aptos: 'APT',
  near: 'NEAR',
  tron: 'TRX',
  base: 'BASE',
  fantom: 'FTM',
  other: '•••',
};

interface Props {
  chain?: ChainNetwork;
  size?: number;
}

export default function ChainIcon({ chain = 'other', size = 60 }: Props) {
  const meta = CHAIN_NETWORK_META[chain];
  const localIcon = CHAIN_LOCAL_ICON[chain];
  const abbrev = CHAIN_ABBREVIATION[chain];
  const fontSize = size * (abbrev.length >= 4 ? 0.22 : 0.28);
  const radius = size * 0.24;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: meta.color,
        },
      ]}
    >
      {localIcon ? (
        <Image
          source={localIcon}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="contain"
          accessible={false}
        />
      ) : (
        <Text style={[styles.label, { fontSize }]}>{abbrev}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
