Before I got this DAP (Digital Audio Player) was using a 7th gen iPod classic for all of my audio needs. In many ways, this thing is worlds better than that antique. Its build quality is fantastic, it has Bluetooth, it has usb type C, and it sounds fantastic! But, there are a few ways the iPod beats it out; Form factor, (The. iPod was tiny) Battery life (With the modded battery i could go for an entire week without having to charge it), and ease of use, both in terms of the button placement for muscle memory, and in the amount of gaffing about i had to do to get my music to behave the way i wanted.

[FIIO M21 With 2nd-gen Sennheiser Momentum On-Ears](image1)

## The Phiscal Aspects of the M21

The player has 4 gigs of ram, and 64 gigs of storage. On the bottom is an exposed Micro SD card slot, a USB-C port for charging and data, and another USB-C port for power-only. This second port does not charge the device, it is instead used to put the player in “Super high gain” mode, which requires an external power supply to utilize. I was initially worried that the MicroSD card would pop out of the player, like old DS cartridges used to. I am happy to report that this has not been an actual issue.

This device has *a lot of buttons* with 7 buttons, and two toggle switches all in, on the right side you have: Power/Sleep, Volume up/down, and the programmable button. Alongside the Desktop Mode, and Hold toggle switches.

In terms of how large it is, the player is both very wide, and very thick. While it is not big enough to be uncomfortable, it will certainly make its presence known in a pocket. The only unfortuanate physical characteristic the device truly has is that it gets very hot, especially when you are  charging the player and listening to music at the same time. Battery life is adequate, giving about 12 hours in my experience, which while not the week of continuous use that my IPod was, its battery lift is certainly adequate.

## Pros and Cons of Android

Let's hop into the android installation! As noted before, this player only has 4gig of RAM, and while it cannot multitask at all, (having more than 3 or 4 apps open in the background will make the audio stutter) consistently closing apps fixes any issues caused by the memory limitation. Plus Fiio did not install almost any bloatware!! So, even with the small amount of ram, the android UI feels responsive and modern.

In many ways, having an android is a mixed bag compared to rockbox on the IPod. The android installed runs very well, having a comprehensive file explorer is fantastic, and the ability to load other applications is very useful. Moreover, this is a very streamlined installation, All of the required settings are easily accessible, and I have had almost zero instances of instability, both of which were easily fixed by rebooting the player. Having a device that is able to connect to the internet is also extremely convenient. Being able to download audiobooks from Audible, stream background music and new songs with Spotify, and wirelessly transfer files to the device are all very nice features to have available to oneself.

However, the android installation does fall short in that it is not a dedicated audio operating. With the IPod running rockbox, the User Interface was tuned for one specific purpose. Apple's clickwheel is very intuitive for volume adjustment, Rockbox was extremely stable and reliable. The iPod is very easy to use with muscle-memory, even going so far as being able to navigate through some of the simplified file explorer without having to look at the device. The FIIO lacks this ability, almost all of its deeper functions require the user looking at the screen. While having Android is undeniably convenient, the Fiio lacks an ephemeral element of simplicity, and focus that makes devices like Apple’s IPod so desirable. I believe that that focus is a large part of what made Apple under Steve Jobs so innovative, and the lack of a well-envisioned leader is a large reason their devices have become so uninteresting to me as of late, but that is a discussion for another blog post.

## The Major Issues I Ran Into

Now, on to the problems, which, unsurprisingly are mostly caused by android (This is another area where the iPod was much easier to work with) The largest sticking point i had when setting up the player was with getting my playlists to behave. I have all of my music in a file tree like this: /All-Inclusive-Music/<Artist Name>/<Album Name>/<Tracks>. The iPod would read every directory as a playlist, and seamlessly continue from one album to another, even when they were by different artists. Moreover, the file structure of the iPod made playlist file management extremely simple. In comparison, on the Fiio I had my music stored on the SD card, making the file path much more complicated. This is a problem because i want to use the native Fiio music app to play my audio files*1 which means I need to get the playlist files to play well with the native application.

The first thing I tried to do was use the built-in “Import playlist” button. This function never worked for me, no matter what I did. I put the playlist files in the right spot, i ensured the file paths to the audio files were correct, i even had Alex help me ensure the files were there by using ADB mode, nothing worked. So, i said, “Alright, ill build the playlists from scratch in the app itself.”, which mostly worked, in that it would throw all of my songs into one playlist, with one slight problem. It would mess up the album order!! For some reason, the Fiio Music app would order the playlists as 1, 10, 11, 12, 2, 3, 4, etc. So, I said, “Well, that’s annoying, but hey I can just put a leading zero in front of all of the track numbers less than 10 right?” NOPE! For some inexplicable reason, the issue persists.

At this point, I had my boyfriend sit down with me and troubleshoot a bunch of things, and we found out that if we formatted the .m3u files correctly (ie, the file paths to music is correct and so on) the Fiio music app will play them just fine, you just have to navigate to the playlist file directly! So, that’s what I do! All of my curated playlists are stored on the device storage under the erstwhile empty /music directory!

**How to make a .m3u8 file work on a FIIO M21:**

1. First connect your device to a Linux computer, and put it in USB Debugging mode
2. install 'android-tools' for a Nix machine, or just 'adb' for a debian-based linux distribution
3. run: adb shell'
4. Accept the prompt on your device
5. Now you can use normal linux navigation around the filetrees, the path you are looking for is: "/storage/external_sd"
6. Verify that your music files are present, as depending on how your SD card is formatted, it may have different
folder structures inside the "external_sd" directory
7. Now, you can use these filepaths as a formatting guideline for your .m3u8 file!


Here is an example of one of my .m3u8 files:

```c
#EXTM3U
#EXTINF:216, 1. Caravan Palace - Miracle
/storage/external_sd/All-Inclusive-Music/Caravan Palace/[2019] Chronologic/01. Miracle.flac
#EXTINF:228, 2. Caravan Palace; Charles X - About You (feat. Charles X)
/storage/external_sd/All-Inclusive-Music/Caravan Palace/[2019] Chronologic/02. About You (feat. Charles X).flac
#EXTINF:214, 3. Caravan Palace - Moonshine
/storage/external_sd/All-Inclusive-Music/Caravan Palace/[2019] Chronologic/03. Moonshine.flac
#EXTINF:243, 4. Caravan Palace - Melancolia
/storage/external_sd/All-Inclusive-Music/Caravan Palace/[2019] Chronologic/04. Melancolia.flac
#EXTINF:186, 5. Caravan Palace - Plume
/storage/external_sd/All-Inclusive-Music/Caravan Palace/[2019] Chronologic/05. Plume.flac
```

I know it's a ton of hoops to jump through just for a few playlist files, but they are important to the way I listen to music! I'm not always sure what I want to listen to, so I put all my songs on shuffle till I find one I vibe with, then re-wind to the start of that album and listen through it! Without my playlist files behaving well, I would not be able to do that.

## Sound Quality Impressions

But, how does it sound? To my ears, very good!! And this is one area where I feel it easily outclasses the old iPod in every way. The first thing i was excited to learn is that it can get quiet, and i mean *really quiet* with the audio setting at 5 with low gain mode turned on, it's basically silent, and, more importantly, the step or change in volume level is both extremely smooth, and granular. In contrast, the IPod, and every other audio device I have ever owned would be a little too loud at its second-lowest setting, and too quiet at the lowest, where the difference in the “step” of the volume between the two would be larger than every other setting. The FIIO does not suffer this fault. This feature is so important to me because I have a really difficult time going to sleep without an audiobook going, and having really low volume is valuable in that situation! See below if my explanation did not make sense

[Graph Showing The Volume Adjustment of the Device](image2)

The first day i got the player, i was fiddling with the gain settings, trying to see how my music library sounded with different modes, i'm no audiophile, so, while i cannot talk on the “flavor” of the sound, the gain settings stemmed to accentuate music the high i set it. The best way I can describe it is that it makes the high and low points in a song more distinctive in a way I quite enjoy. I tend to listen to music with the player on high gain mode, sitting around 30-50% volume and I can actually tell a small difference in audio quality compared to the iPod. Each individual sound is more clearly separated; I notice small background instruments are a bit easier, vocals are slightly clearer, and the bass sounds better with the same set of headphones.

Several weeks ago, I picked up a pair of high-quality in-ear monitors, and the pairing of them with this player truly shines. I could hear detail in acoustics and vocals that i have never noticed or appreciated before (Give Rodrigo y Gabriela, or Brian Scary and the Street Society a try for fun, complex music, two of many artists i used when listening to the new headset), and well recorded audiobooks become a delightfully intimate experience. While I still use my Sennheiser on-ear headphones every day, I truly feel that a pair of enthusiast IEMS let the M21 stretch its legs in a way consumer quality audio equipment does not. Plus, the in-ear headphones wrapping around your ear make them very comfortable for when you are lounging, or doing chores!

[FIIO M21 With TANGZU Xuan Nv In-Ear monitors](image3)

## Closing Thoughts

So, how do I use the player in the day-to-day? Well, I mostly treat it as close to the iPod as I can! I almost always have Bluetooth and Wi-Fi turned off, as I only use wired headphones with it, only turning on Bluetooth when I hop in the car. Having android is actually pretty nice, mostly in that Spotify works perfectly on it (the old glitch I had on my phone causing Spotify to pause playback and close in the background is nonexistent on this player). I only really use 4 applications on the FIIO: Spotify is for discovering new songs, and listening to the loft girl streams, VLC is used for all of my ~downloaded~ audiobooks, Fiio music is for all of my music except the lofi streams, and audible is for the rest of my audiobook library. I have force stopped chrome, and most other apps (Again, there really wasn’t much bloatware at all!) and I never take the player off of do-not-disturb mode.

[Screenshot of my Home Screen](image4)

Now that I have a working playlist method, I am actually very happy with the player! It’s a little chonky, and the battery life is not the best. But, the build quality is fantastic, the audio-quality is great! And having an android installation is actually pretty nice once I figured out a few workarounds. As long as you can be patient with difficult filetrees and androids pitfalls. So far i am very satisfied with the purchase, and i don't think i could have gotten something better for the price point (330USD at the time of purchase). I am very impressed with the current state of mobile audio equipment, and I am optimistic that i will be able to use this player for many years to come.

> *1 As a side note, i have read conflicting things on this, but my assumption is that the native
> Fiio music app will best be able to utilize the goofy dac matrix they put in this thing, as
> compared to playing everything with VLC media player
> 
> — The headphones I use with the player are an old pair of Sennheiser Momentum On-Ears
> (The Second-gen wired ones) and TANGZU Xuan Nv In-Ear monitors