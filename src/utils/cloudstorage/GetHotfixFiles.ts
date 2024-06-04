import { env } from "../..";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";

export function GetDefaultEngine(): string {
  return `[OnlineSubsystemMcp.Xmpp]
bUseSSL=false
ServerAddr="ws://127.0.0.1:${env.XMPP_PORT}"
ServerPort=${env.XMPP_PORT}

[OnlineSubsystemMcp.Xmpp Prod]
bUseSSL=false

ServerAddr="ws://127.0.0.1:${env.XMPP_PORT}"
ServerPort=${env.XMPP_PORT}

[OnlineSubsystemMcp]
bUsePartySystemV2=false

[OnlineSubsystemMcp.OnlinePartySystemMcpAdapter]
bUsePartySystemV2=false

[OnlineSubsystem]
bHasVoiceEnabled=true

[Voice]
bEnabled=true

[XMPP]
bEnableWebsockets=true

[/Script/Engine.InputSettings]
+ConsoleKeys=Tilde
+ConsoleKeys=F8

[/Script/FortniteGame.FortPlayerController]
TurboBuildInterval=0.005f
TurboBuildFirstInterval=0.005f
bClientSideEditPrediction=false

[HTTP.Curl]
bAllowSeekFunction=false

[LwsWebSocket]
bDisableCertValidation=true

[ConsoleVariables]
FortMatchmakingV2.ContentBeaconFailureCancelsMatchmaking=0
Fort.ShutdownWhenContentBeaconFails=0
FortMatchmakingV2.EnableContentBeacon=0
;TODM Fix for External Game Servers (Adrenaline, FS_GS, etc)
net.AllowAsyncLoading=0

[Core.Log]
LogEngine=Verbose
LogStreaming=Verbose
LogNetDormancy=Verbose
LogNetPartialBunch=Verbose
OodleHandlerComponentLog=Verbose
LogSpectatorBeacon=Verbose
PacketHandlerLog=Verbose
LogPartyBeacon=Verbose
LogNet=Verbose
LogBeacon=Verbose
LogNetTraffic=Verbose
LogDiscordRPC=Verbose
LogEOSSDK=Verbose
LogXmpp=Verbose
LogParty=Verbose
LogParty=Verbose
LogMatchmakingServiceClient=Verbose
LogScriptCore=Verbose
LogSkinnedMeshComp=Verbose
LogFortAbility=Verbose
LogContentBeacon=Verbose
LogPhysics=Verbose
LogStreaming=Error

[/Script/Qos.QosRegionManager]
NumTestsPerRegion=1
PingTimeout=3.0
!RegionDefinitions=ClearArray
+RegionDefinitions=(DisplayName="Beyond NA", RegionId="NAE", bEnabled=true, bVisible=true, bAutoAssignable=true)
+RegionDefinitions=(DisplayName="Beyond NA Central LateGame", RegionId="NAW", bEnabled=true, bVisible=true, bAutoAssignable=true)
+RegionDefinitions=(DisplayName="Beyond NA East LateGame", RegionId="NAELG", bEnabled=true, bVisible=true, bAutoAssignable=true)
+RegionDefinitions=(DisplayName="Beyond EU", RegionId="EU", bEnabled=true, bVisible=true, bAutoAssignable=true)
+RegionDefinitions=(DisplayName="Beyond EU LateGame", RegionId="EULG", bEnabled=true, bVisible=true, bAutoAssignable=true)`;
}

export function GetDefaultGame(version: number): string {
  let def: string = `[/Script/EngineSettings.GeneralProjectSettings]
ProjectID=(A=-2011270876,B=1182903154,C=-965786730,D=-1399474123)
ProjectName=Fortnite
ProjectDisplayedTitle=NSLOCTEXT("Beyond", "FortniteMainWindowTitle", "Beyond")
ProjectVersion=1.0.0
CompanyName=Epic Games, Inc.
CompanyDistinguishedName="CN=Epic Games, O=Epic Games, L=Cary, S=North Carolina, C=US"
CopyrightNotice=Copyright Epic Games, Inc. All Rights Reserved.
bUseBorderlessWindow=True

[VoiceChatManager]
bEnabled=true
bEnableOnLoadingScreen=true
bObtainJoinTokenFromPartyService=true
bAllowStateTransitionOnLoadingScreen=false
MaxRetries=5
RetryTimeJitter=1.0
RetryTimeBase=3.0
RetryTimeMultiplier=1.0
MaxRetryDelay=240.0
RequestJoinTokenTimeout=10.0
JoinChannelTimeout=120.0
VoiceChatImplementation=Vivox
NetworkTypePollingDelay=0.0
PlayJoinSoundRecentLeaverDelaySeconds=30.0
DefaultInputVolume=1.0
DefaultOutputVolume=1.0
JoinTimeoutRecoveryMethod=Reinitialize
JoinErrorWorkaroundMethod=ResetConnection
NetworkChangeRecoveryMethod=ResetConnection
bEnableBluetoothMicrophone=false
VideoPreferredFramerate=0
bEnableEOSReservedAudioStreams=true

[VoiceChat.EOS]
bEnabled=true

ReplayStreamerOverride=FortniteDSSReplayStreamer

[/Script/FortniteGame.FortPlayspaceGameState]
bUsePlayspaceSystem=true

[/Script/FortniteGame.FortGameStateAthena]
; BR: Whether to allow the player to build through objects that would normally block placement
bAllowBuildingThroughBlockingObjects=true


[/Script/FortniteGame.FortTextHotfixConfig]
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="LoadingScreen", Key="Connecting", NativeString="CONNECTING", LocalizedStrings=(("en","CONNECTING TO Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="FortLoginStatus", Key="LoggingIn", NativeString="Logging In...", LocalizedStrings=(("ar","Logging In to Beyond..."),("en","Logging In to Beyond..."),("de","Logging In to Beyond..."),("es","Logging In to Beyond..."),("es-419","Logging In to Beyond..."),("fr","Logging In to Beyond..."),("it","Logging In to Beyond..."),("ja","Logging In to Beyond..."),("ko","Logging In to Beyond..."),("pl","Logging In to Beyond..."),("pt-BR","Logging In to Beyond..."),("ru","Logging In to Beyond..."),("tr","Logging In to Beyond..."),("zh-CN","Logging In to Beyond..."),("zh-Hant","Logging In to Beyond...")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="OnlineAccount", Key="DoQosPingTests", NativeString="Checking connection to datacenters...", LocalizedStrings=(("ar","Checking connection to Beyond..."),("en","Checking connection to Beyond..."),("de","Checking connection to Beyond..."),("es","Checking connection to Beyond..."),("es-419","Checking connection to Beyond..."),("fr","Checking connection to Beyond..."),("it","Checking connection to Beyond..."),("ja","Checking connection to Beyond..."),("ko","Checking connection to Beyond..."),("pl","Checking connection to Beyond..."),("pt-BR","Checking connection to Beyond..."),("ru","Checking connection to Beyond..."),("tr","Checking connection to Beyond..."),("zh-CN","Checking connection to Beyond..."),("zh-Hant","Checking connection to Beyond...")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="37020CCD402F073607D9D4A9561EF035", NativeString="PLAY", LocalizedStrings=(("ar","Beyond"),("en","Beyond"),("de","Beyond"),("es","Beyond"),("es-419","Beyond"),("fr","Beyond"),("it","Beyond"),("ja","Beyond"),("ko","Beyond"),("pl","Beyond"),("pt-BR","PLAY"),("ru","Beyond"),("tr","Beyond"),("zh-CN","Beyond"),("zh-Hant","Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="C8C6606D4ED4B816D4A358A42DFBDD59", NativeString="PLAY", LocalizedStrings=(("ar","Beyond"),("en","Beyond"),("de","Beyond"),("es","Beyond"),("es-419","Beyond"),("fr","Beyond"),("it","Beyond"),("ja","Beyond"),("ko","Beyond"),("pl","Beyond"),("pt-BR","PLAY"),("ru","Beyond"),("tr","Beyond"),("zh-CN","Beyond"),("zh-Hant","Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="03875FFD49212D2F37B01788C09086B5", NativeString="Quit", LocalizedStrings=(("ar","Quit Beyond"),("en","Quit Beyond"),("de","Quit Beyond"),("es","Quit Beyond"),("es-419","Quit Beyond"),("fr","Quit Beyond"),("it","Quit Beyond"),("ja","Quit Beyond"),("ko","Quit Beyond"),("pl","Quit Beyond"),("pt-BR","Quit Beyond"),("ru","Quit Beyond"),("tr","Quit Beyond"),("zh-CN","Quit Beyond"),("zh-Hant","Quit Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="1D20854C403FDD474AE7C8B929815DA2", NativeString="Quit", LocalizedStrings=(("ar","Quit Beyond"),("en","Quit Beyond"),("de","Quit Beyond"),("es","Quit Beyond"),("es-419","Quit Beyond"),("fr","Quit Beyond"),("it","Quit Beyond"),("ja","Quit Beyond"),("ko","Quit Beyond"),("pl","Quit Beyond"),("pt-BR","Quit Beyond"),("ru","Quit Beyond"),("tr","Quit Beyond"),("zh-CN","Quit Beyond"),("zh-Hant","Quit Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="1FB7052F40BE8B647B5CA5A362BE8F21", NativeString="Quit", LocalizedStrings=(("ar","Quit Beyond"),("en","Quit Beyond"),("de","Quit Beyond"),("es","Quit Beyond"),("es-419","Quit Beyond"),("fr","Quit Beyond"),("it","Quit Beyond"),("ja","Quit Beyond"),("ko","Quit Beyond"),("pl","Quit Beyond"),("pt-BR","Quit Beyond"),("ru","Quit Beyond"),("tr","Quit Beyond"),("zh-CN","Quit Beyond"),("zh-Hant","Quit Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="2E42C9FB4F551A859C05BF99F7E36FB1", NativeString="Quit", LocalizedStrings=(("ar","Quit Beyond"),("en","Quit Beyond"),("de","Quit Beyond"),("es","Quit Beyond"),("es-419","Quit Beyond"),("fr","Quit Beyond"),("it","Quit Beyond"),("ja","Quit Beyond"),("ko","Quit Beyond"),("pl","Quit Beyond"),("pt-BR","Quit Beyond"),("ru","Quit Beyond"),("tr","Quit Beyond"),("zh-CN","Quit Beyond"),("zh-Hant","Quit Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="370415344EEEA09D8C01A48F4B8148D7", NativeString="Quit", LocalizedStrings=(("ar","Quit Beyond"),("en","Quit Beyond"),("de","Quit Beyond"),("es","Quit Beyond"),("es-419","Quit Beyond"),("fr","Quit Beyond"),("it","Quit Beyond"),("ja","Quit Beyond"),("ko","Quit Beyond"),("pl","Quit Beyond"),("pt-BR","Quit Beyond"),("ru","Quit Beyond"),("tr","Quit Beyond"),("zh-CN","Quit Beyond"),("zh-Hant","Quit Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="538BD1FD46BCEFA4813E2FAFAA07E1A2", NativeString="Quit", LocalizedStrings=(("ar","Quit Beyond"),("en","Quit Beyond"),("de","Quit Beyond"),("es","Quit Beyond"),("es-419","Quit Beyond"),("fr","Quit Beyond"),("it","Quit Beyond"),("ja","Quit Beyond"),("ko","Quit Beyond"),("pl","Quit Beyond"),("pt-BR","Quit Beyond"),("ru","Quit Beyond"),("tr","Quit Beyond"),("zh-CN","Quit Beyond"),("zh-Hant","Quit Beyond")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="FortTeamMemberPedestalNameplate", Key="NotReady", NativeString="Not Ready", LocalizedStrings=(("ar","Beyond - Not Ready"),("en","Beyond - Not Ready"),("de","Beyond - Not Ready"),("es","Beyond - Not Ready"),("es-419","Beyond - Not Ready"),("fr","Beyond - Not Ready"),("it","Beyond - Not Ready"),("ja","Beyond - Not Ready"),("ko","Beyond - Not Ready"),("pl","Beyond - Not Ready"),("pt-BR","Beyond - Not Ready"),("ru","Beyond - Not Ready"),("tr","Beyond - Not Ready"),("zh-CN","Beyond - Not Ready"),("zh-Hant","Beyond - Not Ready")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="FortTeamMemberPedestalNameplate", Key="Ready", NativeString="Ready", LocalizedStrings=(("ar","Beyond - Ready"),("en","Beyond - Ready"),("de","Beyond - Ready"),("es","Beyond - Ready"),("es-419","Beyond - Ready"),("fr","Beyond - Ready"),("it","Beyond - Ready"),("ja","Beyond - Ready"),("ko","Beyond - Ready"),("pl","Beyond - Ready"),("pt-BR","Beyond - Ready"),("ru","Beyond - Ready"),("tr","Beyond - Ready"),("zh-CN","Beyond - Ready"),("zh-Hant","Beyond - Ready")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="CFE470574F97A3A74F4FEAABF1E1F20A", NativeString="No Offers Available", LocalizedStrings=(("ar", "To donate please visit donate.beyondfn.xyz!"),("en", "To donate please visit donate.beyondfn.xyz!"),("de", "To donate please visit donate.beyondfn.xyz!"),("es", "To donate please visit donate.beyondfn.xyz!"),("es-419", "To donate please visit donate.beyondfn.xyz!"),("fr", "To donate please visit donate.beyondfn.xyz!"),("it", "To donate please visit donate.beyondfn.xyz!"),("ja", "To donate please visit donate.beyondfn.xyz!"),("ko", "To donate please visit donate.beyondfn.xyz!"),("pl", "To donate please visit donate.beyondfn.xyz!"),("pt-BR", "To donate please visit donate.beyondfn.xyz!"),("ru", "To donate please visit donate.beyondfn.xyz!"),("tr", "To donate please visit donate.beyondfn.xyz!"),("zh-CN", "To donate please visit donate.beyondfn.xyz!"),("zh-Hant", "To donate please visit donate.beyondfn.xyz!")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="OnlineAccount", Key="TokenExpired", NativeString="Login Expired or Logged In Elsewhere", LocalizedStrings=(("ar","Our backend has been restarted, please re-launch Fortnite."),("en","Our backend has been restarted, please re-launch Fortnite."),("de","Our backend has been restarted, please re-launch Fortnite."),("es","Our backend has been restarted, please re-launch Fortnite."),("es-419","Our backend has been restarted, please re-launch Fortnite."),("fr","Our backend has been restarted, please re-launch Fortnite."),("it","Our backend has been restarted, please re-launch Fortnite."),("ja","Our backend has been restarted, please re-launch Fortnite."),("ko","Our backend has been restarted, please re-launch Fortnite."),("pl","Our backend has been restarted, please re-launch Fortnite."),("pt-BR","Our backend has been restarted, please re-launch Fortnite."),("ru","Our backend has been restarted, please re-launch Fortnite."),("tr","Our backend has been restarted, please re-launch Fortnite."),("zh-CN","Our backend has been restarted, please re-launch Fortnite."),("zh-Hant","Our backend has been restarted, please re-launch Fortnite.")))

#+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="Fortnite.FortAthenaMatchmakingWidget", Key="Message.CanMatchmakeSolo", NativeString="PLAY", LocalizedStrings=(("ar","Play Beyond"),("en","Play Beyond"),("de","Play Beyond"),("es","Play Beyond"),("es-419","Play Beyond"),("fr","Play Beyond"),("it","Play Beyond"),("ja","Play Beyond"),("ko","Play Beyond"),("pl","Play Beyond"),("pt-BR","Play Beyond"),("ru","Play Beyond"),("tr","Play Beyond"),("zh-CN","Play Beyond"),("zh-Hant","Play Beyond")))

+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="FortOnlineAccount", Key="CreatingParty", NativeString="Creating party...", LocalizedStrings=(("en","Hello player! Welcome to Beyond")))

+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="2A1C56D243E8C4418146029BA30A18F4", NativeString="Battle Pass", LocalizedStrings=(("en","Battle Pass")))
;+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="Athena", Key="ThankedBusDriver", NativeString="<{VictimStyle}>{PlayerName}</> has thanked the bus driver", LocalizedStrings=(("en","<{VictimStyle}>{PlayerName}</> is a femboy")))

+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="AC4FAA6C4C5C334E02E1A2A2946A9ADF", NativeString="<{KillerStyle}>{Killer}</> shotgunned <{VictimStyle}>{PlayerName}</>{DistanceText}", LocalizedStrings=(("en","<{KillerStyle}>{Killer}</> dunked on <{VictimStyle}>{PlayerName}</>{DistanceText}")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="730531AF4E52BD15E2DD1CA9067E76A0", NativeString="<{KillerStyle}>{Killer}</> sniped <{VictimStyle}>{PlayerName}</>{DistanceText}", LocalizedStrings=(("en","<{KillerStyle}>{Killer}</> hit a tricky on <{VictimStyle}>{PlayerName}</>{DistanceText}")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="18ACE67C42087F5F7CCD7F82D17785F2", NativeString="A loyal companion.", LocalizedStrings=(("en","mClixy's Dog")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="36844F9344FE49CCAF0F36BA2D33524F", NativeString="Bonesy", LocalizedStrings=(("en","Cooper")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="A42476004D2157CD63B5458DD17B6642", NativeString="Assault Rifle  ", LocalizedStrings=(("en","OP Rifle")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="9F9CE7D946FCD7F813EDAEB954710716", NativeString="Season 6", LocalizedStrings=(("en","Beyond Season 1")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="PartyContext", Key="PlayingSolo", NativeString="Playing Solo", LocalizedStrings=(("en","Playing Lategame")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="NetworkErrors", Key="ReturnToMainMenuTimeout", NativeString="Ack! We lost our connection to the match. Sorry about that. Make sure your internet connection is still good and try again. If it keeps up, visit {CheckStatusURL}.", LocalizedStrings=(("en","discord.gg/beyondmp")))

+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="PartyContext", Key="BattleRoyaleInLobby", NativeString="Battle Royale - In Lobby", LocalizedStrings=(("ar","Beyond - Lobby"),("en","Beyond - Lobby"),("de","Beyond - Lobby"),("es","Beyond - Lobby"),("es-419","Beyond - Lobby"),("fr","Beyond - Lobby"),("it","Beyond - Lobby"),("ja","Beyond - Lobby"),("ko","Beyond - Lobby"),("pl","Beyond - Lobby"),("pt-BR","Beyond - Lobby"),("ru","Beyond - Lobby"),("tr","Beyond - Lobby"),("zh-CN","Beyond - Lobby"),("zh-Hant","Beyond - Lobby")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="PartyContext", Key="BattleRoyaleInGame", NativeString="Battle Royale - {0} Remaining", LocalizedStrings=(("ar","Beyond - {0} Remaining"),("en","Beyond - {0} Remaining"),("de","Beyond - {0} Remaining"),("es","Beyond - {0} Remaining"),("es-419","Beyond - {0} Remaining"),("fr","Beyond - {0} Remaining"),("it","Beyond - {0} Remaining"),("ja","Beyond - {0} Remaining"),("ko","Beyond - {0} Remaining"),("pl","Beyond - {0} Remaining"),("pt-BR","Beyond - {0} Remaining"),("ru","Beyond - {0} Remaining"),("tr","Beyond - {0} Remaining"),("zh-CN","Beyond - {0} Remaining"),("zh-Hant","Beyond - {0} Remaining")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="NetworkConnectionLost", NativeString="Network Connection Lost", LocalizedStrings=(("en","The server most likely crashed :(")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="30C8C9204EAF7FF602BF51BA2914EF27", NativeString="EPIC PASSWORD", LocalizedStrings=(("en","PASSWORD")))
;+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="01D48B6841B636C086E7BBA829B0F432", NativeString="Solo", LocalizedStrings=(("en","LateGame Solo")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="0C08C0CB4F22661348F7F08031BEFB01", NativeString="Go it alone in a battle to be the last one standing.", LocalizedStrings=(("en","The most fast paced match in Beyond! Go in alone and be the last one standing!")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="CA2EC1714F23111FDBE6439EBC961404", NativeString="EMAIL", LocalizedStrings=(("en","EMAIL")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, Namespace="", Key="C865741A4692B9EE424EF6928A50CD08", NativeString="Declare your support for a Creator! Your in-game purchases will help support this Creator.", LocalizedStrings=(("en","Support a Beyond Creator to send 10% of the amount of your purchase to the creator!")))
+TextReplacements=(Category=Game, bIsMinimalPatch=True, bHidden=true,Namespace="", Key="B43430364CDEBF9E59C6BBAFDA2FB883", NativeString="CAREER",  LocalizedStrings=(("en","STATS")))


[/Script/FortniteGame.FortGameInstance]
KairosMinSupportedAppVersion=20
bBattleRoyaleMatchmakingEnabled=true
!FrontEndPlaylistData=ClearArray
FrontEndPlaylistData=(PlaylistName=Playlist_DefaultSolo, PlaylistAccess=(bEnabled=True, bIsDefaultPlaylist=true, bVisibleWhenDisabled=false, bDisplayAsNew=false, CategoryIndex=0, bDisplayAsLimitedTime=false, DisplayPriority=3))
+FrontEndPlaylistData=(PlaylistName=Playlist_DefaultDuo, PlaylistAccess=(bEnabled=True, bIsDefaultPlaylist=true, bVisibleWhenDisabled=false, bDisplayAsNew=false, CategoryIndex=0, bDisplayAsLimitedTime=false, DisplayPriority=4))
+FrontEndPlaylistData=(PlaylistName=Playlist_DefaultSquad, PlaylistAccess=(bEnabled=True, bIsDefaultPlaylist=true, bVisibleWhenDisabled=false, bDisplayAsNew=false, CategoryIndex=0, bDisplayAsLimitedTime=false, DisplayPriority=6))
+FrontEndPlaylistData=(PlaylistName=Playlist_BattleLab, PlaylistAccess=(bEnabled=False, bIsDefaultPlaylist=false, bVisibleWhenDisabled=true, bDisplayAsNew=false, CategoryIndex=1, bDisplayAsLimitedTime=false, DisplayPriority=16))

; Arena
+FrontEndPlaylistData=(PlaylistName=Playlist_ShowdownAlt_Solo, PlaylistAccess=(bEnabled=True, bIsDefaultPlaylist=true, bVisibleWhenDisabled=false, bDisplayAsNew=true, CategoryIndex=1, bDisplayAsLimitedTime=false, DisplayPriority=17))
+FrontEndPlaylistData=(PlaylistName=Playlist_ShowdownAlt_Duos, PlaylistAccess=(bEnabled=False, bIsDefaultPlaylist=true, bVisibleWhenDisabled=false, bDisplayAsNew=true, CategoryIndex=1, bDisplayAsLimitedTime=false, DisplayPriority=19))
+ExperimentalBucketPercentList=(ExperimentNum=23,Name="BattlePassPurchaseScreen",BucketPercents=(0, 50, 50))

[/Script/FortniteGame.FortPlayerPawn]
NavLocationValidityDistance=500
MoveSoundStimulusBroadcastInterval=0.5
bCharacterPartsCastIndirectShadows=true

[/Script/FortniteGame.FortOnlineAccount]
bShouldAthenaQueryRecentPlayers=false
bDisablePurchasingOnRedemptionFailure=false

[/Script/FortniteGame.FortPlayerControllerAthena]
bNoInGameMatchmaking=true

[/Script/GameFeatures.GameFeaturesSubsystemSettings]
+DisabledPlugins=DiscoveryBrowser

[VoiceChat.Vivox]
bEnabled=true
ServerUrl="https://mtu1xp-mad.vivox.com"
ServiceUrl="https://mtu1xp-mad.vivox.com"
Domain="https://unity.vivox.com/appconfig/46738-lunar-79863-udash"
Issuer="46738-lunar-79863-udash"
Key="ikvUeQAPzWGPKuAYfsiKMbLCgHIdzG2K"
SecretKey="ikvUeQAPzWGPKuAYfsiKMbLCgHIdzG2K"

[VoiceChat.EOS]
bEnabled=true

[EOSSDK]
ProductName=VoicePlugin
ProductVersion=0.1
ProductId="d3df2e4cdf384ae0a2d87faa746d9f95"
SandboxId="d4ede3c68024456a85135250c48595a1"
DeploymentId="8bf4df3e0d154871b5c71b94d2f8994d"
ClientId="xyza7891WBgblbBRIWSsYVvQLjyUSvIo"
ClientSecret="CsDH07ei7JX5nlChe3XrthvsSsn1g4huyXAPLf3hmN8"

[/Script/FortniteGame.FortChatManager]
bShouldRequestGeneralChatRooms=true
bShouldJoinGlobalChat=true
bShouldJoinFounderChat=false
bIsAthenaGlobalChatEnabled=true
RecommendChatFailureDelay=30
RecommendChatBackoffMultiplier=2.0
RecommendChatRandomWindow=120.0
RecommendChatFailureCountCap=7

[OnlinePartyEmbeddedCommunication]
bRetainPartyStateFields=false
bPerformAutoPromotion=true
InviteNotificationDelaySeconds=1.0

[/Script/Party.SocialSettings]
bMustSendPrimaryInvites=true
bLeavePartyOnDisconnect=false
bSetDesiredPrivacyOnLocalPlayerBecomesLeader=false
DefaultMaxPartySize=16`;

  if (version === 4) {
    def.replace(
      `+FrontEndPlaylistData=(PlaylistName=Playlist_BattleLab, PlaylistAccess=(bEnabled=False, bIsDefaultPlaylist=false, bVisibleWhenDisabled=true, bDisplayAsNew=false, CategoryIndex=1, bDisplayAsLimitedTime=false, DisplayPriority=16))`,
      `+FrontEndPlaylistData=(PlaylistName=Playlist_Playground, PlaylistAccess=(bEnabled=True, bIsDefaultPlaylist=true, bVisibleWhenDisabled=false, bDisplayAsNew=true, CategoryIndex=1, bDisplayAsLimitedTime=false, DisplayPriority=16))`,
    );
  }

  return def;
}

export function GetDefaultRuntimeOptions(): string {
  return `[/Script/FortniteGame.FortRuntimeOptions]
bEnableGlobalChat=true
bDisableGifting=false
bDisableGiftingPC=false
bDisableGiftingPS4=false
bDisableGiftingXB=false
!ExperimentalCohortPercent=ClearArray
+ExperimentalCohortPercent=(CohortPercent=100,ExperimentNum=20)

[Vivox]
bEnabled=true
ServerUrl="https://unity.vivox.com/appconfig/46738-lunar-79863-udash"
Domain="mtu1xp.vivox.com"
MaxConnectRetries=3
MaxLoginRetries=3
MaxJoinRetries=3
MaxMuteRetries=3
; Retry delay = Rand(-RetryTimeJitter, RetryTimeJitter) + RetryTimeMultiplier * Pow(RetryTimeBase, Retry)
RetryTimeJitter=0.5
RetryTimeBase=2.0
RetryTimeMultiplier=0.5
MaxRetryDelay=30.0`;
}
