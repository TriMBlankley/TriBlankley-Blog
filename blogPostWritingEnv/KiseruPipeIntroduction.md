There are five major projects I have on the horizon that require the use of CAD software in order to bring them to fruition. However, now that I am no longer a full-time student, I have lost access to the Autodesk suite of parametric cad tools. As such, I have installed solidworks, as my father has an older permanent seat I can make use of. I am passingly familiar with solidworks, but I have never made any complete pieces in it, and need to learn its quirks and UI before jumping into the more complex projects planned for the future. 

## KISERU PIPE

So, to get started, I want a simple object I can model in a single day. I am going to go with a Kiseru smoking pipe. As I have been wanting to make one of my own for a year or so now. So, what is a Kiseru smoking pipe, and why do I want to build one? Kiseru pipes are a traditinal Japanise tobacco pipe, specially designed for a unique type of finely cut herb called kizami. They are characterized by the small herb bowl, as the kizami tobacco is very nicotine-rich, and one only needed a small amout. As to why I want to go out of my way to make my own pipe? Im a Blankley, my father made his own pipe, my sister tried but ran into some interesting issues I hope to resolve, and I just dont feel right not having at least tried to make my own.

I first came across kiseru pipes from anime. You often see them held in the hands of villainesses, and I had always liked the vibe they give off. But, as I have no desire to start smoking tobacco, I had never considered buying one of my own. My interest in them increased when I started periodically smoking weed. I never liked any of the existing weed pipes. As usually their bowls are too large for my small tolerance, they can be quite fragile, hard to clean, and honestly I have yet to find one that I think is vibey. Too often they are clinical looking glass constructions, blobs of silicone, or rustic wodden affairs. 

Kiseru pipes were the answer I came to, as I find them quite aesthetically pleasing, however, the example I have has a couple of issues. (My current kiseru pipe is pictured below.)

[My Kiseru Pipe](image1)

First and foremost, it is very difficult to clean due to the bamboo tube. The bamboo tubes are apparently supposed to act as “natural filters” for the smoke. That is nonsense, From what research i have done the only semi-safe way to inhale substances like dàmá*1 is through a heat-not-burn device, but those devices give a strange texture to the smoke that I do not like. So, if there is no filtering happening, why not replace the tube with a longer steel version that is easy to remove and clean? As a bonus, such tubes are easy to find for an affordable price online. Here is a like to the [Steel Tubes](https://www.amazon.com/dp/B071DGGRY8?ref=ppx_yo2ov_dt_b_fed_asin_title) I got. 

The next function of the tube is to give the smoke time to cool off. As the heat of the vapor entering one's lungs is another factor that makes smoking harmful and unpleasant.*2 However, my Kiseru is rather short, not allowing the smoke very much time to cool off. I chose a long tube of 25cm for this project. My plans for this pipe have another benefit of being adjustable. If I want to, I can get a shorter, or longer tube in the future.

The next problem plaguing my existing pipe is its construction. It is a traditional kiseru, meaning it is made of a sheet of brass that has been hammered into shape after which the seam is soldered closed. This is a problem because brass is very much not-ok to smoke out of. And while I am alright with killing my lungs with things grown from the earth, heavy-metals are a step too far for me. I will be getting this pipe cast in silver, and while silver is less bad than brass, it is still not the best. So, I will also be getting the bowl of my pipe enameled with metal-free glass. 

The other major issue I have with my pipe is the size of its bowl. I initially became interested in kiseru pipes because of how small their bowls are, as I felt that the small size would waste less herb compared to the oversized bowls of most pipes on the market. This turned out to be true. When I smoke using my Kiseru I find myself using less weed than I do when smoking a joint. However, my kiseru is actually a step too small. As it cannot hold enough material to keep a coal burning. Almost every time I take a puff of the pipe I have to re-light it. Which is just annoying enough to warrant my changing its size. 

And the final issue I have with my current pipe is that it cannot stand on its own! This may seem like a frivolous task, but it would be really nice to be able to set the pipe on a table and not have it try to roll around.

So, with all of the problems laid out. What are the plans for the new pipe?

The pipe will contain 3 major pieces. The headpiece/bowl, the mouthpiece, and the tube connecting the two. The mouthpiece will have the ability to add a small filter to prevent any embers getting through the pipe. The tube will have a clearance-fit with the mouthpiece and bowl, and will be seated into them by wrapping string along the ends until it is a press-fit. Small grooves may need to be ground into the edges of the tube to facilitate this. But I will test that once all of the pieces are assembled. 

## SOLIDWORKS

I started with modelling the pipe itself, pulled directly from the listing, this pipe has an ID of 5.5mm, and an OD of 6.5 cm while being 25cm long. I also changed its material to AISI 304 steel, and added it as the first part of my assembly file.

[SolidWorks render of a steel tube](image2)

I saved both the pipe, and assembly file, and created a new part where I would rough-out the bowl. Using this online [Tolerance Calculator](https://www.mesys.ch/calc/tolerances.fcgi?lang=en) gave me 0.028mm as a good clearance-fit for these pieces. However, I am admittedly unsure if I used the tool correctly. Regardless, I am using 6.527mm for the ID of the bowl to pipe cavity. I am not too worried if I get this dimension wrong, as if anything it will be undersized, and in the unlikely event that the cavity is oversized, I can just order a set of appropriate tubing.

Moving on to the airway, I was first overcomplicating these steps, where I started with a 3D sketch that described the ID of the tube, and the path it would follow. I think this couple have worked, but I ran into a few issues where the sweep function did not like that the profile, and the path it had to follow were described in the same sketch object. Instead I found that I could just describe the path, and use the sweep functions builtin circle function. This also allowed me to add a fillet to the path, making a smooth curve for the airway from the bowl to the rest of the tubing. 

[Error message when using a profile and path on the same sketch](image3)

This is one area where solidworks handily beats out Autodesk, and absolutely trounces FreeCad: The usefulness of error messages, and its user manual. Both of which are extremely descriptive. Here is an example of the Solidworks manual page on lofts. 

[SolidWorks manual page](image4)

### THE BOWL

I ran into quite a few issues when creating the lofted feature of the bowl. To start with, I was first trying to mix open and closed paths for the loft, where the top and bottom were closed loops, and the middle parts were open spline lines. Right away solidworks let me know that that would not work, And i changed the open spline lines to being closed paths. After that, while I was able to perform a loft operation, it was not smooth. Instead each step of the loft was a direct line to the next step. While this would undoubtedly work, I wanted a smoother bowl, as I felt that the hard corners would make it harder to clean.

After some research, the answer turned out to be that I was missing guide curves. This curve went perpendicular to each spline path, and I was pleasantly surprised that just one guide wire was enough to make the transition between each loft anchor smooth. Here are the wireframes that were used for each step of the loft operation: 

[Wireframe of the bowl](image5)

So, with all of the necessary geometry, let's see how it all comes together! First off a mirror operation makes the bowl well… Bowl shaped, then I added a fillet between the tube cavity and the airway to make the headpiece easier to clean with a pipe cleaner. Giving the following result:

[The headpiece and bowl of the pipe](image6)

Now that the Bowl/ Headpiece is modeled, let's get the mouthpiece made. It is much more simple, needing  just the tube piece, a recessed area for the paper filter, and the tube making up the rest of the length. Finally, we add all three objects to the assembly file, giving a complete picture of the pipe. 

[Complete render of the smoking pipe](image7)

You may notice that it is for lack of a better word… Ugly. and, there are a few other glaring issues aside, The bowl does not have any voids, the ID of the tube void is more of an OD, and there is no thickness anywhere to be seen! While I could probably flesh out this design in SolidWorks, I feel there is a more interesting opportunity available. I want to model the body of the mouthpiece and body in Blender, as it is much more conducive to organic shapes. To do this. I will use pictures of the pipe I want to create, as modeled in wax, and then use the model created with solidworks as a basis to create a void in the center of the model. The process of which will be described in the next blog post!

### Thougts on SolidWorks as a Parametric Cad suite

So, now that I have some experience making a complex device with soldiworks, what are my thoughts on the software? Overall, I am very satisfied with it. When compared with Autodesk 365, the only toolset solidworks is really missing is nerve based modeling tools. If I was doing this project in Autodesk, I would not feel the need to leave it and finish the model in blender. And, while SolidWorks’s UI is much more “dated” compared to Autodesks, it is not at all bad. I also much prefer the system SolidWorks uses to add features to an object. As an example, if I wanted to make a cube with beveled edges in a blender, I would extrude the cube, and add a bevel operation. In the object tree on the left, Autodesk would only show the cube. And selecting it would make a timeline appear at the bottom of the viewport where the bevel operation is shown. This system was never the best for me. In order to make the best use of the timeline, you have to be extremely careful with fully defining every feature, and you often cannot re-order any operations without first rolling back an object. Losing the features you made after. 

Instead of a timeline, solidworks places each operation as its own feature object. To take the cube with a rounded bevel example, the object tree would show both an extrude operation to create the cube, then another feature of the bevel. In my experience, this created less issues when making changes to the initial sketch, or re-ordering features in real time. You would not have to roll a whole group of features back, and instead can selectively turn-off the problematic feature. I will have to go into greater detail on if the loss of nerve-based modeling is a problem after I test the Solidworks to Blender workflow.

> 1. That is a traditional name for cannabis in China, where the má means both hemp and numbness, and the leading dà modifies the word to mean “Big hemp” or “Big numbness”. While this is interesting, I really only added this to see if my blog could handle rendering the accented text. Did it work on your phone?
> 
> 2. just to be clear, the heat is a MINOR part of what causes damage, and cooling the smoke only really serves to make inhaling it less uncomfortable. This is one area where water-pipes excel.
