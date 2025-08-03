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

  // —— Hook UNUserNotificationCenter delegate & register for APNs ——
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  [application registerForRemoteNotifications];

  // —— Request iOS Push Permissions ——  
  // (Moved to your custom UI—commented out here)
  /*
  UNAuthorizationOptions authOptions =
    UNAuthorizationOptionAlert |
    UNAuthorizationOptionSound |
    UNAuthorizationOptionBadge;
  [center requestAuthorizationWithOptions:authOptions
                        completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (granted) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [application registerForRemoteNotifications];
      });
    } else {
      NSLog(@"Push authorization denied: %@", error);
    }
  }];
  */

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

#pragma mark – APNs ↔ FCM

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  NSLog(@"APNs device token retrieved: %@", deviceToken);
  [FIRMessaging messaging].APNSToken = deviceToken;
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  NSLog(@"Failed to register for remote notifications: %@", error);
}

#pragma mark – UNUserNotificationCenterDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  NSDictionary *userInfo = notification.request.content.userInfo;
  NSLog(@"Will present notification in foreground: %@", userInfo);
  completionHandler(
    UNNotificationPresentationOptionAlert   |
    UNNotificationPresentationOptionSound   |
    UNNotificationPresentationOptionBadge
  );
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  NSLog(@"Notification response received: %@", userInfo);
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
  completionHandler();
}

#pragma mark – FIRMessagingDelegate

- (void)messaging:(FIRMessaging *)messaging didReceiveRegistrationToken:(NSString *)fcmToken {
  NSLog(@"FCM registration token: %@", fcmToken);
  // TODO: send this token to your server if needed
}

@end
