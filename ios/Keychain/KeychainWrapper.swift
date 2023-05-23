//
//  KeychainManager.swift
//  SeedWarden
//
//  Created by Tommaso Carpi on 04/01/23.
//

import Foundation
import KeychainAccess

@objc(KeychainWrapper) class KeychainWrapper: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {return true}
  
  static let sharedInstance = KeychainWrapper()
  
  let keychain = Keychain(service: Constants.keychainID)
  
  @objc func getValueForKey(_ key:String, withSync synchronizable:Bool) -> String? {
    let keychain = self.keychain.synchronizable(synchronizable)
    
    var value: String?
    
    do {
      value = try keychain.getString(key)
    } catch let error {
      print(error)
    }
    
    return value
  }
  
  @objc func setValueForKey(_ value:String, at key:String, withSync synchronizable:Bool) -> NSNumber {
    let keychain = self.keychain.synchronizable(synchronizable)
    
    do {
      try keychain.set(value, key: key)
      return 1
    } catch let e {
      print(e)
      return 0
    }
  } 
  
}
