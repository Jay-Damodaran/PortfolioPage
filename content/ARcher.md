---
title: "ARcher- Best Hardware Hack"       # card heading + timeline label + list title
type: competition                    # one of: project | competition | work | experience  (drives color/icon + grouping)
role: "Hardware/Firmware"          # shown in List squircle and detail card
start: 2026-10                      # timeline placement + timespan display
end: 2026-10                        # or the literal: present
image: images/ARcher.jpg            # optional; shown in detail card
links:                              # optional; rendered in detail card
  - label: "GitHub"
    url: "https://github.com/Jay-Damodaran/ARcher"
---

**Best Hardware, HackTX 2026**
ARcher: an AR archery game you play with a $10 glove

ARcher turns your living room into a castle siege. A LiDAR iPhone scans the room and builds a stone castle on your real floor. Enemy trebuchets, soldiers and siege ladders move around your actual furniture, and walls and people hide the castle the way real objects would. You defend it with a bow glove: clench your fist to draw and open your hand to loose. The glove measures how far you've drawn and how you're tilting your hand, and the shot fires the moment you let go.

We built it as a team of four at HackTX 2026, one of the largest hackathons in Texas with over 900 participants, and won the Best Hardware track.

My role was the glove and its connection to the game:
- Hardware design. I chose the components (a Seeed XIAO ESP32 microcontroller, a flex sensor and an LSM6DSO32 IMU) and the power source (a USB battery pack), designed the circuit (a voltage divider to read the flex sensor, the IMU on I2C), and identified the firmware building blocks, such as Adafruit's I2C sensor driver.
- Glove assembly. I worked out where every part sits on the glove and how it's fastened, so the electronics stay put and don't break while a player repeatedly draws and releases.
- Glove-to-phone link. The glove joins the phone's hotspot and streams its readings over UDP. I added a reliability layer so a dropped Wi-Fi packet never loses a shot: one-off messages are sent several times and de-duplicated, commands carry IDs and are retried until answered, and the phone side was tested against a simulated glove. I also aligned the glove's minimum draw with the game's, so a weak pull cancels cleanly instead of misfiring. In playtesting, no one, including me, noticed any lag between releasing and the arrow firing.

Why it matters
Hand-tracking controllers for AR and VR, such as Meta's, cost hundreds of dollars. The ARcher glove uses about $5-10 of parts at volume, and the same platform (a phone's LiDAR for the environment plus a cheap flex-sensor and motion glove for the hand) could reach well beyond games:
- A universal, low-cost controller for AR games and apps
- Robotics training data: Recording what a person's hand does alongside a LiDAR map of the space around them captures how humans interact with real environments, data that could help teach robots to work in human spaces the way people do
- Accessibility: With more flex sensors on the same design, the glove could spell out American Sign Language
- Medical robotics: The glove could be an intuitive, inexpensive interface for controlling medical robotic systems