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
    isDeleted: boolean;
    createDate: Date;
    updateDate: Date;


    constructor({ id, provider, seed, name, address, password, isDeleted, createDate, updateDate }: { id: number, provider: number, seed: string, name: string, address: string | undefined, password: string | undefined, isDeleted?: boolean, createDate?:Date, updateDate?:Date }) {
        this.address = address;
        this.seed = seed;
        this.provider = provider;
        this.name = name;
        this.image = getProviderImagePath(provider);
        this.password = password;
        this.id = id
        this.isDeleted = isDeleted ?? false
        this.createDate = createDate ?? new Date()
        this.updateDate = updateDate ?? new Date('1970-01-01')
    }

    getWallet = () => {
        return {
            address: this.address,
            seed: this.seed,
            provider: this.provider,
            name: this.name,
            password: this.password,
            id: this.id,
            isDeleted: this.isDeleted,
            createDate: this.createDate,
            updateDate: this.updateDate
        }
    }
}