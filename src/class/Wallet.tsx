import { ImageSourcePropType } from "react-native";
import { getProviderImagePath, getProviderName } from "../utils/utils";

export default class Wallet {
    id: number;
    address: string | undefined;
    seed: string;
    provider: number;
    name: string;
    image: ImageSourcePropType;
    password: string | undefined;

    constructor({ id, provider, seed, name, address, password }: { id: number, provider: number, seed: string, name: string, address: string | undefined, password: string | undefined }) {
        this.address = address;
        this.seed = seed;
        this.provider = provider;
        this.name = name;
        this.image = getProviderImagePath(provider);
        this.password = password;
        this.id = id
    }

    getWallet = () => {
        return {
            address: this.address,
            seed: this.seed,
            provider: this.provider,
            name: this.name,
            password: this.password,
            id: this.id
        }
    }
}