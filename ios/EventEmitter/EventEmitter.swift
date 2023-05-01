//
//  EventEmitter.swift
//  Obsidian
//
//  Created by Tommaso Carpi on 30/01/21.
//

import Foundation

@objc(EventEmitter)
open class EventEmitter: RCTEventEmitter {

  public static var emitter: RCTEventEmitter!
  
  @objc public override static func requiresMainQueueSetup() -> Bool {return true}

  override init() {
    super.init()
    EventEmitter.emitter = self
  }

  open override func supportedEvents() -> [String] {
    ["url"]
  }
  
}


