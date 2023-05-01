//
//  Events.m
//  Obsidian
//
//  Created by Tommaso Carpi on 30/01/21.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(EventEmitter, RCTEventEmitter)
  RCT_EXTERN_METHOD(supportedEvents)
@end
