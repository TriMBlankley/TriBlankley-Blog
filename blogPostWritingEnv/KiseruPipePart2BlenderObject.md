Now that we have cavity models of both the bowl, and mouthpiece of the pipe. We need to make the actual bodies of each.

## Rough Bodies

I started by exporting the SolidWorks files as .STL objects, and importing them into Blender. From there, I began making the body of the bowl, beginning with a simple cylinder, scaling it to be slightly larger than the main tube of the imported STL. I aligned both such that the centers of the cylinders are on 0-0-0. This makes it easy to manipulate each section by locking the movement to the X axis, and allowing one  to easily scale the loops to to make a smooth graduation. To get the shape right, I scaled an image of both my current Kiseru pipe, and a wax carving of the pipe I would like. Only having a side, and top view image limits how accurate we can truly get, but what makes Blender so powerwefull as a CAD suite is how fluid an objects geometry can be. The sillouette may not be 100% accurate when building off 2d Images, but its more than enough for a starting point. From there, we can refine and add detail that would be difficult to sculpt into wax. 

The “body” of the bowl piece came together quickly, coming to the bowl itself, I had to decide whether I should model the bowl as another object, or instead to make it a continuation of the rest of the pipe. I decided to make it one single piece, and am very happy with the outcome. I modeled it by progressively rotating the loops a little bit at a time, while also scaling them down from the large width of the body. Once I had the loops rotated a full 90 degrees, I began to increase them in size as I moved up the bowl of the pipe.

Next up, we need to model  the dragons feet! These not only add to the style of our pipe, but will also act as functional feet allowing one to place the pipe on a table and have it stand up on its own. To model the feet, we took our model, and entered Blenders’ Sculpt mode. Working with a 3D mouse.

Sculpting in Blender can be frustrating if using only a mouse and keyboard. My preffered IO when sculpting is to use a 3DXConnection space mouse to rotate the model in space, and use a drawing tablet as the pointing device. The 3D mouse is convinent, but they are expensive, can be difficult to get drivers working well, and have a rather steep learning curve. Certainly nice to have, but not at all required hardware. In my opinion the much more important item is the drawing tablet. Using a digital pen provides much more accuracy than a traditional mouse can afford, and having pressure sensitivity is extremely valuable when working with sculpting brushes, as a light touch can offer quite alot of refinement.

Already, I am quite happy with the resulting pipe. We already have a great idea of the shape of the pipe, and by importing the cavities created during our last blog post, we already have a  great idea of how the pipe will work! 

[Wireframe of the Kseru’s bowl](image1)

### Difficulties When Creating a Solid Foundation for Detail:

At a glance everything looks fine, But, the issue lies with how blockey the pipe currently is. If we tried to print it as-is now. Those “facets” would certainly be visible. Moreover, I plan to cut channels into the surface of the pipe  to give texture, and sculpt character and life into the piece. Right now, there is not enough information present in order to add these features. If we tried to doso, the channels would look blockey, and have strange slopes at vertex corners. I envision the channels to be made of thin, smooth sloping lines with rounded ends, in a similar vein to the plans for my tatoos.
Too add the detail, we just need more data points and geometry to work with! The good thing is, Blender has a tool for that, where we jsut need to apply a subdivision operation to the  body.

[Pipe after subdivision, showing spiked artifacts around internal cuts](image2)

the rest of the pipe looks nice and smooth, but what happened to the edges of the bowl? My understanding is that the root of the problem is how the subdivision generates data. If an object is not properly set up for it, you will run into garbage-in, garbage-out situations where the subdivision function is trying to generate faces based off of bad geometry. Because the edges of the bowl are a so thin, and because of the shape of the faces on the top of the pipe before the cut operation, you run into lots of bad geometry.

Wide, thin triangles are nightmares for a subdivision algorithms in the best of times. Think of a subdivision modifer as a knife cutting all of the triangles comprising an object or meth shape in half. A computer cannot cannot always intutivly cut triangles aloing their longest face, instead what can happen is a group of super oblique triangles converging into a center spor. This issue is only made worse when you add the boolian cut operation between the body, and the shapre of the bowl’s interior. This is espcicially true along the rim, were the thin wall adds alot of non-ideal geometry to an already difficult step.

In our case, this results in many areas where the top of your bowl suddenly has a chip, awkward overhang, or zones converging on one anolther, simply because that was the best way the computer could figure out to make a cohesive surface. 

[Image of triangle with bad geometry](image3)

> On a side note, If you tried to bring an object back into SolidWorks in a state like this the import will almost certainly fail. Even if you can import the file, SolidWorks will probably be unable to generate a solid object, and you would not be able to work with the shape before extensive fixing.

### So, How Do You Fix the Geometry Issue?

Two changes! First and foremost being the input shape. In our case, trying to subdivide the pipe’s body with the inside tubes and bowl pre-cut was wreaking havock on the subdivision operation, both due to the thin wall on the rim of the bowl, and due to the complex and very un-optimized geometry created by solidworks exporting the pipe’s interior as an stl. This kind of issue is not limited to just making a pipe or due to taking a 3d file from one CAD suite to antother. Any object with sharp spikes, thin areas, or sharp creases will give object-wide modifier operations a hard time. In this case, the easiest way to fix this is to make cutting the interior of the pipe the very last step.

The next thing I leanred is that you should retopologize and obejct **before** preforming the surface subdivision. Due to the very large amount of detail we need for the mask and channel cuts, doing things in this order is important to prevent large layers with sharp corners forming. It will also ensure that when each triangle is made smaller, it will doso while better conforming to a smooth, convex shape.

After you have these operations complete, and enough detail is present take some time in the sculpt mode to iron out any rough areas. We will also have to repeat the smoothing using the sculpt mode after preforming the boolian operation around the very edges where the interior begins, but we will only doso after all the channel cuts are complete.

## Refined Body With Character Channel Cuts 

I tried using sculpting brushes, but  I could never get them quite right. Mainly, I was frustrated by the lack of a consistent depth and width of each cannel. Using the [layer  tool](https://docs.blender.org/manual/en/3.5/sculpt_paint/sculpting/tools/layer.html) in subtract mode fixed the depth issue, but not the with. I would also find myself spaming the contol + z command and try to re-do a certain pathway. It got to the point where I would spend almost 30 minutes per channel. I had to find a better way.

The breakthrough happened when I watched a video on [how to create smple clothing on a character model](https://www.youtube.com/watch?v=FdD-wY_-s2w). In the video, the teacher used the sculpt masking tool as a kind of selection brush. I figured the masking tool could be the perfect answer to my problem. As the ability to refine a channels path, witdth, and stroke without having to commit to actually cutting the channels, or have to worry about multiple strokes of the layer tool cuasing strange stepp effect vastly sped up the devleopment of drawing the channels on the pipes body.

So, I started by inverting the mask. This made the entire model masked out, and would ensure that using any conventional sculpt tools would not affect the model. Then. Using the masking tool in subtract mode, with a standardized 80pt width, I began by blocking out the large details lie the mouth, and underbelly scaled areas with the pointer in mirror-mode. After these were done, I turned off mirror mode and began drawing the channels, swapping between subtract, and add modes of the masking tool using them as a penic, and eraiser. During this step, I made heavy use of my 3DConexion spacemouse to pan arond the model, Working with my pen tablets stylus in my left hand, and the spacemouse in my right. 

It took several weeks to land on a design I was happy with, but once I was ready, cutting the channels themselves was super simple! All we needed to do was to set the layer tool to the correct depth, register the models surface, and set the with of the tool to a very large brush size. Then, In a single pas over the pipe we were done! It honestly scared me a little, as doing things this way made my laptop freeze up for a moment. After giving it a couple of seconds to think the exterior design of the pipe was done! Here is a final look on the exterior of the bowl for my Kiseru Pipe:

[Bowl of my Kiseru Pipe with Exterior Dragon’s Texture-Cuts Done](image4)

All that is left to do, is to cut the interior bowl, smoke, and tube channels, and we are ready to moove this from a digital project, to the physical world!

## Moving Forward

So, now that the pipe’s shape is finalized, we’ll shift focus to the actual construction of the pipe! To start, we need to nail down a method for attaching the bowl and mouthpiece to an intermediary tube. At first I was considering simple friction-fit, using o-rings to provide the friction and sealing action. However that system adds complications on fitment, and cutting grooves into the tubing so a pair of O-Rings seat properly sounded difficult with how thin the tubing walls are. I also did not like the idea of having to keep extra o-rings on hand if any of them got torn. I briefly considered using threading to fasten the ends togethor, but I find threading to be rather unsighly, and in this case the threads would have to be very small, vastly increasing the odds of cross-threading. 

After discussing the issue with my dad, he reccomended a cam-lock system. Where we rivet in a pin to the tube, and have a groove cut into the bowl and mouthpice for this pin to travel, adding a simple 90 degree bend to the end of the channel will allow for the user to twist the bowl and mouthpice locked. I quite like the diea, with it being tool-less, elegant, and will ensure the bowl and mouthpice are always clocked against each other properly. So, the first step in making this pipe a reality will be to get these modeled in the solidworks file. 

After this is done, ill print everything with my normal FDM printer, do some test-fits, then get the models printed professionaly in wax. After this, we just need to get them cast, and the bowl enameled with glass.

