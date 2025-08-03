#import "AppDelegate.h"

// React Native
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

// Firebase
#import <Firebase.h>
#import <FirebaseMessaging.h>

// Push Notifications
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKit/FlipperKit.h>
static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  [client start];
}
#endif

@interface AppDelegate() <UNUserNotificationCenterDelegate, FIRMessagingDelegate>
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

  // —— Firebase Initialization ——
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }
  [FIRMessaging messaging].delegate = self;

  // —— Request iOS Push Permissions ——
  // UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  // center.delegate = self;
  // UNAuthorizationOptions authOptions =
  //   UNAuthorizationOptionAlert |
  //   UNAuthorizationOptionSound |
  //   UNAuthorizationOptionBadge;
  // [center requestAuthorizationWithOptions:authOptions
  //                       completionHandler:^(BOOL granted, NSError * _Nullable error) {
  //   if (granted) {
  //     dispatch_async(dispatch_get_main_queue(), ^{
  //       [application registerForRemoteNotifications];
  //     });
  //   } else {
  //     NSLog(@"Push authorization denied: %@", error);
  //   }
  // }];

  // —— React Native Bridge & Root View ——
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:[self sourceURLForBridge:nil]
                                            moduleProvider:nil
                                             launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"userapp1"
                                            initialProperties:nil];
  rootView.backgroundColor = [UIColor systemBackgroundColor];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootVC = [UIViewController new];
  rootVC.view = rootView;
  self.window.rootViewController = rootVC;
  [self.window makeKeyAndVisible];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

#pragma mark – APNs <→> FCM

// Called when APNs has assigned the device a token
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  NSLog(@"APNs device token retrieved: %@", deviceToken);
  // Pass it to Firebase
  [FIRMessaging messaging].APNSToken = deviceToken;
}

// Called when APNs registration failed
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  NSLog(@"Failed to register for remote notifications: %@", error);
}

#pragma mark – UNUserNotificationCenterDelegate

// Receive displayed notifications for iOS 10 devices (foreground)
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
  NSDictionary *userInfo = notification.request.content.userInfo;
  NSLog(@"Will present notification: %@", userInfo);
  // Show alert, sound, badge even when in foreground:
  completionHandler(UNNotificationPresentationOptionAlert |
                    UNNotificationPresentationOptionSound |
                    UNNotificationPresentationOptionBadge);
}

// Handle user tapping on notification
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler {
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  NSLog(@"Did receive notification response: %@", userInfo);
  // Forward to RN PushNotificationIOS if you use it
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
  completionHandler();
}

#pragma mark – FIRMessagingDelegate

// FCM direct data messages in foreground
- (void)messaging:(FIRMessaging *)messaging didReceiveRegistrationToken:(NSString *)fcmToken {
  NSLog(@"FCM registration token: %@", fcmToken);
  // TODO: send token to your app server if needed
}

@end
