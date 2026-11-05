# Church Attendance & Member Profile App — Product Requirements Document (PRD)

_Version 1.1 · Working title: ChurchConnect (rename freely)_

## 1. Overview

A mobile-first web app (installable PWA) for a church denomination. Every member has a digital profile and a streak record. For each service, the usher or admin displays one QR code on a screen. Members scan it with their own phone camera, see a welcome message with their name, and tap Present to confirm. Attendance appears instantly on the usher's live list, replacing manual counting. The app also keeps a record of each member's department and activities, and has a temporary photo gallery where members can view and download pictures taken at church. Photos disappear from the app after 7 days.

## 2. Problem

- Ushers count attendance by hand, which is slow, inaccurate and gives no record per person.
- The church cannot easily see who attends regularly, who has stopped coming, or how departments are doing.
- Pictures from services are scattered across individual phones and WhatsApp groups.

## 3. Goals

1. Let a member confirm attendance in a few seconds by scanning one service QR code and tapping Present.
2. Keep an accurate attendance history and a streak for every member.
3. Give leaders simple reports (by service, department, member).
4. Give members one place to see and download service photos, with automatic cleanup after 7 days.

**Non-goals (v1):** online giving or payments, live streaming, full church accounting, native iOS/Android apps.

## 4. Users and roles

| Role                      | Description                                       | Key permissions                                                                                            |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Member                    | Any registered church member                      | Scan the service QR to check in, view own profile, attendance history and streak, view and download photos |
| Usher / Attendance marker | Volunteer at the door                             | Display the service QR, watch the live attendance list, mark members manually by name or phone             |
| Department Head           | Leads a department (choir, ushering, media, etc.) | View attendance and members of own department                                                              |
| Photographer / Media      | Media team member                                 | Upload photos to the gallery                                                                               |
| Admin / Secretary         | Church office                                     | Manage members, departments, services, activities, all reports                                             |
| Super Admin               | Denomination or head-pastor office                | Manage branches, admins, system settings                                                                   |

## 5. Core features

### 5.1 Member profile (MVP)

- Full name, phone number, optional email, optional photo, gender, date of birth (optional).
- Status: ordinary member or department member (one or more departments).
- Activities the member takes part in (Sunday school, Bible study, youth fellowship, choir practice, etc.).
- A unique member ID, plus current streak and longest streak, shown on the profile.

### 5.2 Attendance (MVP)

The core feature. There is one QR code per service. The usher or admin displays it, and each member scans it with their own phone.

**How check-in works**

1. Admin or usher creates a service (for example, Sunday First Service) and taps Open attendance.
2. The app shows a large service QR on the usher's screen or a projector. The QR refreshes about every 60 seconds.
3. The member scans it with the phone's normal camera. The QR opens a link to the app.
4. If the member is not logged in, they log in (or register) and are returned straight to the check-in page.
5. A welcome page says: "Welcome to church, Isaac. Please confirm your presence in the House of your Maker." It also shows the service name, the date and the member's current streak.
6. The member taps **Present**. The app records attendance and shows a thank-you screen with the updated streak.
7. The record appears on the usher's live attendance list within a few seconds.

**Rules**

- Attendance can only be marked while the service is open.
- One record per member per service. A second scan shows "You are already marked present at 9:12 AM".
- The QR holds only the service ID and a short-lived token, never personal data.
- An expired token shows "This QR has expired. Please scan the screen again."
- Optional: the usher can switch on a location check (the member must be near the church) to stop check-ins from home.
- Fallbacks: usher manual search by name or phone, and guest entries for visitors (convertible to members later).
- Later: a one-time code by SMS or WhatsApp for members who cannot scan.
- Admin can correct mistakes, and every change is logged.

**Live usher view**

- Running total, a list of members as they check in (name, department, time), search, and a manual Mark present button.

### 5.3 Streaks (MVP)

Streaks reward consistency and give leaders a simple health signal.

- A streak counts consecutive services a member attended. It is counted per service type (for example Sunday services), so a midweek service does not break a Sunday streak.
- Missing a service that was opened and closed resets the current streak to zero. Services that were never opened do not count.
- Each member sees their current streak, longest streak and attendance this month.
- Milestone badges at 4, 12 and 52 services in a row.
- Leaders see members whose streak just broke, for follow-up.
- Streaks are encouragement, not a public ranking: members see only their own streak.

### 5.4 Service and activity management (MVP)

- Create services (type, date, time, branch) and open or close attendance.
- Create activities and departments; assign members to them.
- Optional activity attendance (for example, Sunday school class attendance) using the same scan flow.

### 5.5 Reports (MVP, basic)

- Total attendance per service, with men/women/children breakdown if data exists.
- Attendance history per member.
- Members absent for N consecutive services (follow-up list).
- Attendance by department.
- Export to CSV.

### 5.6 Photo gallery with 7-day expiry (MVP)

- Media team uploads photos, optionally grouped into an album (for example, "Sunday 3 Nov Service").
- Members browse a grid, open a photo and tap Download to save it to their device.
- Each photo shows how many days remain.
- After 7 days a photo is automatically deleted from the app and from storage.
- Admin can delete a photo early.
- Members are told clearly that photos expire and should be downloaded if they want to keep them.

### 5.7 Notifications (Phase 2)

- WhatsApp or SMS reminders for services, and follow-up messages to absent members.
- Birthday messages.

## 6. User stories (selection)

- As a member, I want to scan the church QR with my phone camera and tap Present, so I am marked in seconds.
- As an usher, I want to display the service QR and watch members appear on a live list, so I do not count by hand.
- As an usher, I want to mark someone manually when they cannot scan.
- As a secretary, I want the attendance total for each service without counting.
- As a member, I want to see my streak so I stay consistent.
- As a department head, I want to see who in my department missed the last three services.
- As a media team member, I want to upload many photos at once.
- As a member, I want to download the pictures I am in before they expire.

## 7. Functional requirements (summary)

| ID    | Requirement                                                                 | Priority |
| ----- | --------------------------------------------------------------------------- | -------- |
| FR-1  | Register and log in (phone number plus OTP or password)                     | Must     |
| FR-2  | Member profile with department and activities                               | Must     |
| FR-3  | Service QR generated by usher or admin, with a short-lived rotating token   | Must     |
| FR-4  | Welcome and confirm page after a member scans the QR, with a Present button | Must     |
| FR-5  | Reject duplicate attendance for the same service                            | Must     |
| FR-6  | Manual attendance fallback with audit flag                                  | Must     |
| FR-7  | Create, open and close services                                             | Must     |
| FR-8  | Role-based access control                                                   | Must     |
| FR-9  | Attendance reports and CSV export                                           | Must     |
| FR-10 | Photo upload, gallery and download                                          | Must     |
| FR-11 | Photos auto-delete after 7 days                                             | Must     |
| FR-12 | Code via SMS or WhatsApp check-in                                           | Should   |
| FR-13 | Guest/visitor entries                                                       | Should   |
| FR-14 | Retry and clear error handling on poor networks                             | Could    |
| FR-15 | Multi-branch support                                                        | Could    |
| FR-16 | Live usher attendance list that updates within a few seconds                | Must     |
| FR-17 | Streak tracking (current, longest) and member streak view                   | Must     |
| FR-18 | Optional location check at check-in                                         | Could    |

## 8. Non-functional requirements

- **Performance:** tapping Present should confirm in about 1–2 seconds on a typical mobile connection.
- **Mobile-first:** works well on low-end Android phones, installable as a PWA.
- **Security:** HTTPS, hashed passwords, JWT in HTTP-only cookies, rate limiting on login, check-in and code requests, short-lived rotating QR tokens, server-side role checks.
- **Privacy:** members' data and photos are visible only to authenticated users. Church photos are not public. Consent is recorded at registration.
- **Reliability:** nightly database backups for member and attendance data (but not photos).
- **Accessibility:** large tap targets, readable fonts, and usable by older members.

## 9. Privacy and legal notes

This app holds personal data and photos, including of children. In Nigeria the Nigeria Data Protection Act (NDPA) 2023 applies. Practical steps: collect only needed data, record consent at registration, include a short privacy notice, restrict photo access to logged-in members, and get parent or guardian consent for children's photos. Confirm details with the church leadership or a legal adviser.

## 10. Success metrics

- Share of members who check in at least once a month.
- Average time to check in a member.
- Percentage of services whose attendance was recorded fully in the app.
- Number of photo downloads per week.
- Count of follow-up actions taken from the absent-members list.

## 11. Release plan

- **MVP (v1):** auth, profiles, service QR check-in, live usher list, streaks, manual fallback, services, basic reports, photo gallery with 7-day expiry.
- **v1.1:** guest entries, WhatsApp or SMS code check-in, department-level views.
- **v2:** location check, notifications, multi-branch, activity-level attendance analytics.

## 12. Risks and open questions

| Risk / question                                                        | Mitigation or decision needed                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Members without smartphones                                            | Usher manual check-in by name or phone, guest entry                                        |
| QR photo shared with people who are not present                        | Rotating QR token (about 60 seconds), usher watches the live list, optional location check |
| Poor network at the venue                                              | Lightweight pages, retry on failure, usher manual fallback                                 |
| SMS/WhatsApp cost                                                      | Start with QR only, add messaging later                                                    |
| Photo storage cost                                                     | 7-day auto delete keeps storage small                                                      |
| Single church or many branches?                                        | Decide before building the data model                                                      |
| Should photo download be allowed for all members or only those tagged? | Decide with church leadership                                                              |
