package com.seedwarden;

import android.content.SharedPreferences;

import androidx.annotation.NonNull;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class KeychainWrapper extends ReactContextBaseJavaModule {
    private SharedPreferences prefs;

    KeychainWrapper(ReactApplicationContext context) {
        super(context);
        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            prefs = EncryptedSharedPreferences.create(
                    context,
                    Constants.KEYCHAIN_ID,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @NonNull
    @Override
    public String getName() {
        return "KeychainWrapper";
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getValueForKey(String key, boolean synchronizable) {
        if (prefs == null) return "[]";
        return prefs.getString(key, "[]");
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public int setValueForKey(String value, String key, boolean synchronizable) {
        if (prefs == null) return 1;
        try {
            prefs.edit().putString(key, value).apply();
            return 0;
        } catch (Exception e) {
            return 1;
        }
    }
}
