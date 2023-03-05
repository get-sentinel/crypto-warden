//
//  KeychainWrapper.m
//  SeedWarden
//
//  Created by Tommaso Carpi on 04/01/23.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(KeychainWrapper,NSObject)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getValueForKey: (NSString*)key withSync:(BOOL)synchronizable)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setValueForKey: (NSString*)tokens at:(NSString*)key withSync:(BOOL)synchronizable)

@end
