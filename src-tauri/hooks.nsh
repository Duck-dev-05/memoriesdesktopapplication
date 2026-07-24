!include "LogicLib.nsh"
!include "x64.nsh"

!macro NSIS_HOOK_INIT
  ; 1. Block 32-bit (x86) Operating Systems
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "This application requires a 64-bit (x64) Windows operating system. 32-bit (x86) systems are not supported."
    Quit
  ${EndIf}

  ; 2. Block unsupported Windows 10 builds
  ClearErrors
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion" "CurrentBuildNumber"
  
  ; Ensure the OS build number is at least 17763 (Windows 10 Version 1809)
  ${IfNot} ${Errors}
    ${If} $0 < 17763
      MessageBox MB_OK|MB_ICONSTOP "This application requires Windows 10 Version 1809 (Build 17763) or newer. Your current version of Windows is not supported."
      Quit
    ${EndIf}
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREINSTALL
  nsExec::Exec 'taskkill /F /IM memoriesdesktop-app.exe /T'
  nsExec::Exec 'taskkill /F /IM "Memories Desktop.exe" /T'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  nsExec::Exec 'taskkill /F /IM memoriesdesktop-app.exe /T'
  nsExec::Exec 'taskkill /F /IM "Memories Desktop.exe" /T'
!macroend

