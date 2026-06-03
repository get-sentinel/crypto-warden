//
//  KeychainManager.swift
//  SeedWarden
//
//  Created by Tommaso Carpi on 04/01/23.
//

import Foundation
import KeychainAccess

@objc(KeychainWrapper) class KeychainWrapper: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { return false }
  
  static let sharedInstance = KeychainWrapper()
  
  let keychain = Keychain(service: Constants.keychainID)
  
  @objc func getValueForKey(_ key:String, withSync synchronizable:Bool) -> String {
    let keychain = self.keychain.synchronizable(synchronizable)
    
    var value:String
    
    do {
      value = try keychain.getString(key) ?? "[]"
      return value
    } catch let e {
      print(e)
      return "[]"
    }
  }
  
  @objc func setValueForKey(_ value:String, at key:String, withSync synchronizable:Bool) -> NSNumber {
    let keychain = self.keychain.synchronizable(synchronizable)

    do {
      try keychain.set(value, key: key)
      return 0
    } catch let e {
      print(e)
      return 1
    }
  }

  // One-time migration of wallets from the legacy SeedWarden keychain.
  //
  // The app was renamed SeedWarden -> Crypto Warden and its bundle id changed from
  // com.sentinel.seedwarden to com.sentinel.warden. iOS scopes keychain items by
  // access group (<TeamPrefix>.<bundleId>), so the rename left the old wallets
  // stranded in a sibling group this build couldn't see. The old binary also used
  // service "wallets" (not Constants.keychainID). This copies that blob into the
  // current store. Idempotent and non-destructive:
  //  - never overwrites a populated current store, and
  //  - returns the number of characters migrated (0 = nothing to do).
  // Requires `<AppIdentifierPrefix>com.sentinel.seedwarden` in keychain-access-groups.
  @objc func migrateLegacyWalletsIfNeeded() -> NSNumber {
    // Don't clobber existing data.
    if let current = try? self.keychain.getString("wallets"),
       !current.isEmpty, current != "[]" {
      return 0
    }

    // Resolve this build's team prefix from the default access group.
    let probe = Keychain(service: "legacy.migrate.probe")
    try? probe.set("1", key: "p")
    let defaultGroup = (probe.allItems().first?["accessGroup"] as? String) ?? ""
    try? probe.remove("p")
    let prefix = defaultGroup.components(separatedBy: ".").first ?? ""
    if prefix.isEmpty { return 0 }

    let legacyGroup = "\(prefix).com.sentinel.seedwarden"
    // Old binary: service "wallets", key "wallets". getString ignores the
    // synchronizable attribute by default, so it matches local or iCloud copies.
    let legacy = Keychain(service: "wallets", accessGroup: legacyGroup)
    guard let value = try? legacy.getString("wallets"),
          !value.isEmpty, value != "[]" else {
      return 0
    }

    do {
      try self.keychain.set(value, key: "wallets")
      return NSNumber(value: value.count)
    } catch {
      return 0
    }
  }

}
