(function () {
  "use strict";

  const P = (hex, name) => ({ hex, name });
  const palettes = {
    pup1: [P("#efd7ab", "Sunlit cream"), P("#c98c55", "Honey coat"), P("#8d5238", "Warm chestnut"), P("#47362f", "Cocoa shadow"), P("#d88975", "Blush rose"), P("#63877c", "Sage green"), P("#f7eee1", "Soft linen")],
    pup2: [P("#d9a899", "Dusty rose"), P("#f0d7c5", "Petal cream"), P("#8e646b", "Mauve"), P("#4a4542", "Charcoal"), P("#9aaa82", "Garden sage"), P("#d9b768", "Golden pollen"), P("#fcf5eb", "Porcelain")],
    pup3: [P("#c58e63", "Cinnamon"), P("#ead0ad", "Biscuit"), P("#744838", "Burnt umber"), P("#302c2a", "Espresso"), P("#7c9c9a", "Rain blue"), P("#c9a6a0", "Heather"), P("#f5eee5", "Oat milk")],
    pup4: [P("#eee0c7", "Oat curl"), P("#bd8d67", "Caramel"), P("#79594b", "Truffle"), P("#342f2d", "Deep cocoa"), P("#c98770", "Terracotta"), P("#6f8a79", "Eucalyptus"), P("#f8f2e9", "Ivory")],
    desert: [P("#f0c987", "Desert sun"), P("#d88766", "Coral ridge"), P("#9b5f55", "Mauve mesa"), P("#5a4261", "Twilight plum"), P("#406b61", "Saguaro"), P("#89a58d", "Dusty sage"), P("#f5e1be", "Sand glow")],
    alpine: [P("#d9e2df", "Cloud mist"), P("#7da0a2", "Lake blue"), P("#385f64", "Deep water"), P("#455b4b", "Pine"), P("#81906a", "Meadow"), P("#d2b27d", "Sunlit stone"), P("#f7f3ea", "Snow")],
    tuscan: [P("#edc77c", "Tuscan sun"), P("#d28a5c", "Terra cotta"), P("#9d6a4e", "Clay roof"), P("#6e7d51", "Olive grove"), P("#a8a873", "Dry grass"), P("#657b79", "Distant blue"), P("#f5e9ce", "Warm plaster")],
    coast: [P("#c9dfe1", "Sea mist"), P("#699aa0", "Tidal blue"), P("#315f69", "Deep sea"), P("#e3b85f", "Beacon gold"), P("#bd735f", "Weathered red"), P("#64786b", "Coastal pine"), P("#f6efe3", "Salt white")],
    peony: [P("#f2d8d2", "Shell pink"), P("#db9a9c", "Peony rose"), P("#a85e72", "Berry petal"), P("#6b3d53", "Wine shadow"), P("#7d9570", "Leaf sage"), P("#405e52", "Forest leaf"), P("#e5be6b", "Pollen")],
    wild: [P("#f2d6a4", "Buttercup"), P("#cf7a68", "Poppy"), P("#8d7291", "Violet"), P("#7193a0", "Cornflower"), P("#82956e", "Stem green"), P("#48675d", "Deep leaf"), P("#e9ded0", "Glass light")],
    sun: [P("#f2c85f", "Sunflower"), P("#d8963f", "Amber petal"), P("#7f5638", "Seed brown"), P("#44382f", "Earth"), P("#71824c", "Leaf green"), P("#a9aa71", "Soft sage"), P("#ece1c9", "Canvas")],
    lotus: [P("#f2d9dc", "Lotus blush"), P("#d79aad", "Rose petal"), P("#9f6685", "Orchid shade"), P("#7fa1a0", "Pond blue"), P("#456f69", "Lily leaf"), P("#ddc06e", "Golden center"), P("#e8efea", "Water light")],
    garden1: [P("#eadcc8", "Cottage stone"), P("#c88169", "Brick rose"), P("#d3aa66", "Golden bloom"), P("#7f9b70", "Garden leaf"), P("#49685b", "Hedge green"), P("#8c7290", "Foxglove"), P("#cbd9d3", "Morning sky")],
    garden2: [P("#d9d1c5", "Aged stone"), P("#788e7d", "Ivy"), P("#405c50", "Deep hedge"), P("#bf7b72", "Climbing rose"), P("#e4b96b", "Dappled gold"), P("#797085", "Gate shadow"), P("#eff0e8", "Quiet light")],
    garden3: [P("#d4a86d", "Terracotta pot"), P("#ecdbc0", "Limestone"), P("#718b68", "Basil"), P("#415f50", "Rosemary"), P("#9e7e77", "Thyme bloom"), P("#d6b65f", "Lemon"), P("#b5cbc3", "Soft aqua")],
    garden4: [P("#e8c894", "Sun wall"), P("#c6735f", "Clay tile"), P("#426d61", "Agave"), P("#7f9a79", "Olive leaf"), P("#b38a7a", "Bougainvillea"), P("#4e5f78", "Evening blue"), P("#f4ead8", "Plaster")],
    butterfly: [P("#e7b655", "Marigold"), P("#c66f49", "Burnt orange"), P("#3f3430", "Velvet black"), P("#f0dfb6", "Wing light"), P("#718b75", "Meadow green"), P("#9d7890", "Wild thistle"), P("#d9e4dd", "Open sky")],
    koi: [P("#dce8e4", "Water light"), P("#70a1a0", "Jade water"), P("#386e70", "Pond deep"), P("#e3a04f", "Koi gold"), P("#c95f4d", "Koi coral"), P("#f4eee2", "Pearl"), P("#58745a", "Lily green")],
    bird: [P("#6ca8a2", "Hummingbird teal"), P("#3d6e64", "Emerald wing"), P("#9f6b8a", "Ruby throat"), P("#e2b95c", "Flower gold"), P("#cf796b", "Trumpet coral"), P("#78906c", "Leaf green"), P("#e4ece7", "Sky wash")],
    cat: [P("#d8c2a5", "Moon glow"), P("#68728a", "Night blue"), P("#34394d", "Midnight"), P("#8d667c", "Heather roof"), P("#d69a64", "Window gold"), P("#596e61", "Quiet pine"), P("#eee8dc", "Starlight")]
  };

  let rid = 0;
  const region = (type, n, attrs, label) => ({ id: `r${++rid}`, type, n, attrs, label });
  const circle = (cx, cy, r, n, label = [cx, cy]) => region("circle", n, { cx, cy, r }, label);
  const ellipse = (cx, cy, rx, ry, n, label = [cx, cy], transform) => region("ellipse", n, { cx, cy, rx, ry, ...(transform ? { transform } : {}) }, label);
  const rect = (x, y, width, height, n, label = [x + width / 2, y + height / 2], rx = 0) => region("rect", n, { x, y, width, height, rx }, label);
  const path = (d, n, label) => region("path", n, { d }, label);
  const poly = (points, n, label) => region("polygon", n, { points }, label);
  const line = (x1, y1, x2, y2, n, width = 10, label) => region("line", n, { x1, y1, x2, y2, "stroke-width": width, "stroke-linecap": "round" }, label || [(x1 + x2) / 2, (y1 + y2) / 2]);

  function petals(cx, cy, count, rx, ry, numbers, radius = 28, rotation = 0) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const angle = rotation + (360 / count) * i;
      const rad = (angle - 90) * Math.PI / 180;
      const px = cx + Math.cos(rad) * radius;
      const py = cy + Math.sin(rad) * radius;
      const lx = cx + Math.cos(rad) * radius * .9;
      const ly = cy + Math.sin(rad) * radius * .9;
      items.push(ellipse(px, py, rx, ry, numbers[i % numbers.length], [lx, ly], `rotate(${angle} ${px} ${py})`));
    }
    return items;
  }

  function puppyScene(v) {
    const a = [];
    a.push(rect(0, 0, 800, 620, 7));
    a.push(path("M0 405 Q170 355 335 420 T800 392 V620 H0Z", 6, [690, 505]));
    if (v === 0) {
      a.push(circle(650, 112, 65, 1), circle(650, 112, 42, 7));
      a.push(ellipse(405, 450, 180, 120, 2, [410, 500]));
      a.push(ellipse(405, 300, 150, 142, 2));
      a.push(path("M300 255 Q210 235 235 390 Q265 430 326 354Z", 3, [270, 330]));
      a.push(path("M510 255 Q600 235 575 390 Q545 430 484 354Z", 3, [540, 330]));
      a.push(ellipse(405, 345, 90, 68, 1));
      a.push(circle(354, 296, 18, 4), circle(456, 296, 18, 4));
      a.push(circle(350, 291, 5, 7), circle(452, 291, 5, 7));
      a.push(ellipse(405, 350, 28, 20, 4));
      a.push(path("M386 380 Q405 398 424 380 Q421 416 405 422 Q389 416 386 380Z", 5, [405, 402]));
      a.push(ellipse(314, 520, 65, 42, 1), ellipse(496, 520, 65, 42, 1));
      a.push(...petals(145, 434, 7, 18, 32, [1,5], 29)); a.push(circle(145, 434, 17, 5));
    } else if (v === 1) {
      a.push(...petals(130, 132, 8, 20, 42, [1,2,3], 39)); a.push(circle(130, 132, 20, 6));
      a.push(...petals(686, 420, 7, 18, 38, [1,2,3], 37)); a.push(circle(686, 420, 18, 6));
      a.push(ellipse(410, 442, 178, 120, 4, [410, 500]));
      a.push(ellipse(410, 300, 145, 132, 4));
      a.push(path("M285 255 Q224 280 252 388 Q277 421 323 354Z", 3, [275, 335]));
      a.push(path("M535 255 Q596 280 568 388 Q543 421 497 354Z", 3, [545, 335]));
      a.push(ellipse(410, 352, 86, 61, 2));
      a.push(circle(358, 296, 16, 4), circle(462, 296, 16, 4), ellipse(410, 350, 28, 18, 4));
      a.push(path("M390 378 Q410 395 430 378 Q425 410 410 417 Q395 410 390 378Z", 1, [410, 397]));
      a.push(path("M332 225 Q365 180 410 216 Q455 180 488 225 Q462 196 410 245 Q358 196 332 225Z", 1, [410, 218]));
    } else if (v === 2) {
      a.push(circle(114, 100, 52, 6));
      a.push(ellipse(405, 430, 205, 100, 1, [410, 474]));
      a.push(ellipse(405, 290, 130, 125, 1));
      a.push(path("M300 240 Q220 180 225 390 Q264 408 326 341Z", 3, [265, 294]));
      a.push(path("M510 240 Q590 180 585 390 Q546 408 484 341Z", 3, [545, 294]));
      a.push(ellipse(405, 342, 76, 54, 2));
      a.push(circle(360, 286, 15, 4), circle(450, 286, 15, 4), ellipse(405, 339, 25, 17, 4));
      a.push(path("M388 365 Q405 384 422 365 Q419 397 405 403 Q391 397 388 365Z", 5, [405, 385]));
      a.push(line(214, 447, 123, 377, 3, 26, [165, 410]));
      a.push(circle(112, 368, 26, 5), circle(149, 390, 20, 5));
      a.push(...petals(680, 128, 6, 16, 29, [5,6], 27)); a.push(circle(680, 128, 14, 5));
    } else {
      a.push(path("M0 0 H800 V205 Q614 180 492 230 T0 182Z", 1, [680, 96]));
      a.push(ellipse(405, 430, 190, 112, 2, [410, 492]));
      a.push(circle(405, 298, 147, 1));
      for (const [x,y,r,n] of [[300,225,48,2],[350,178,45,1],[414,174,50,2],[476,190,43,1],[520,240,46,2],[290,304,40,1],[520,318,38,1]]) a.push(circle(x,y,r,n));
      a.push(path("M280 267 Q215 262 245 400 Q275 419 320 353Z", 3, [267, 335]));
      a.push(path("M530 267 Q595 262 565 400 Q535 419 490 353Z", 3, [543, 335]));
      a.push(ellipse(405, 354, 82, 58, 7));
      a.push(circle(359, 297, 16, 4), circle(451, 297, 16, 4), ellipse(405, 350, 26, 18, 4));
      a.push(path("M386 379 Q405 397 424 379 Q420 410 405 418 Q390 410 386 379Z", 5, [405, 398]));
      a.push(ellipse(315, 516, 60, 35, 7), ellipse(495, 516, 60, 35, 7));
    }
    return a;
  }

  function landscapeScene(v) {
    const a = [rect(0, 0, 800, 620, 1)];
    if (v === 0) {
      a.push(circle(635, 120, 64, 1));
      a.push(path("M0 275 Q120 210 245 275 T470 250 T800 235 V620 H0Z", 2, [140, 284]));
      a.push(path("M0 360 Q145 280 290 350 T570 315 T800 298 V620 H0Z", 3, [600, 365]));
      a.push(path("M0 452 Q155 380 315 447 T610 410 T800 397 V620 H0Z", 7, [660, 478]));
      a.push(path("M0 520 Q165 452 350 520 T800 475 V620 H0Z", 4, [224, 545]));
      a.push(path("M520 442 V238 M520 295 Q476 276 470 230 M520 346 Q568 322 578 266", 5, [520, 346]));
      a.push(path("M220 485 V345 M220 388 Q180 370 172 330 M220 425 Q258 405 270 360", 5, [220, 425]));
      a.push(ellipse(94, 511, 54, 16, 6), ellipse(676, 521, 66, 17, 6));
    } else if (v === 1) {
      a.push(path("M0 340 L170 160 L290 305 L430 105 L630 325 L720 215 L800 318 V620 H0Z", 3, [430, 218]));
      a.push(poly("318,218 430,105 541,232 460,195 420,226 389,181", 7, [428,174]));
      a.push(poly("101,235 170,160 246,250 181,220 157,248", 7, [170,211]));
      a.push(path("M0 370 Q178 318 320 375 T800 342 V620 H0Z", 5, [680, 391]));
      a.push(path("M0 435 Q180 385 360 435 T800 392 V620 H0Z", 2, [450, 455]));
      a.push(path("M0 530 Q190 465 390 520 T800 480 V620 H0Z", 4, [140, 548]));
      for (const [x,y,s] of [[70,430,1],[120,410,1],[655,420,1],[705,402,1],[748,438,1]]) a.push(poly(`${x},${y} ${x+18*s},${y-55*s} ${x+36*s},${y}`, 4, [x+18*s,y-20*s]));
    } else if (v === 2) {
      a.push(circle(650, 105, 55, 1));
      a.push(path("M0 290 Q150 225 310 282 T800 235 V620 H0Z", 6, [100, 292]));
      a.push(path("M0 360 Q160 292 320 355 T800 310 V620 H0Z", 4, [600, 354]));
      a.push(path("M0 445 Q160 365 335 442 T800 390 V620 H0Z", 5, [165, 450]));
      a.push(rect(520, 285, 150, 105, 7, [595,340], 2), poly("505,286 595,235 685,286", 3, [595,268]));
      a.push(rect(555, 330, 30, 60, 2), rect(615, 318, 28, 30, 2));
      for (const x of [95,145,205,725]) a.push(path(`M${x} 472 Q${x-18} 415 ${x} 360 Q${x+18} 415 ${x} 472Z`, 4, [x,422]));
      a.push(path("M330 620 C355 535 410 460 555 390 L590 390 C460 485 425 555 415 620Z", 7, [430,540]));
    } else {
      a.push(circle(640, 105, 49, 4));
      a.push(path("M0 330 Q180 280 360 328 T800 290 V620 H0Z", 1, [150,340]));
      a.push(path("M0 390 Q180 340 365 392 T800 350 V620 H0Z", 2, [610,410]));
      a.push(path("M0 500 Q190 430 380 493 T800 452 V620 H0Z", 3, [240,530]));
      a.push(path("M0 545 Q100 480 210 530 L290 620 H0Z", 6, [120,545]));
      a.push(rect(515, 240, 74, 190, 7, [552,340], 4), rect(506, 220, 92, 28, 5, [552,234], 3));
      a.push(rect(534, 280, 36, 38, 4), rect(536, 368, 32, 62, 5));
      a.push(path("M488 220 Q552 172 616 220Z", 5, [552,208]));
      a.push(path("M690 452 Q662 390 700 330 Q720 390 704 452Z", 6, [698,400]));
      a.push(circle(695, 328, 34, 6));
    }
    return a;
  }

  function flowerScene(v) {
    const a = [rect(0, 0, 800, 620, v === 0 ? 1 : 7)];
    if (v === 0) {
      a.push(...petals(390, 300, 12, 55, 110, [1,2,3,2], 90, 7));
      a.push(...petals(390, 300, 9, 33, 65, [2,3,4], 54, 12));
      a.push(circle(390,300,42,7));
      a.push(path("M320 430 Q225 420 170 520 Q275 535 350 462Z", 5, [270,480]));
      a.push(path("M470 430 Q570 408 650 500 Q548 532 438 465Z", 6, [545,475]));
    } else if (v === 1) {
      a.push(path("M250 585 L275 290 M390 585 L390 240 M525 585 L505 315", 5, [391,470]));
      a.push(path("M250 470 Q160 405 125 475 Q190 515 262 500Z", 6, [195,474]));
      a.push(path("M392 420 Q480 350 548 415 Q490 462 390 452Z", 5, [467,420]));
      a.push(path("M504 485 Q600 435 660 500 Q590 535 512 516Z", 6, [582,500]));
      a.push(...petals(275,270,7,22,50,[1,2],45)); a.push(circle(275,270,20,6));
      a.push(...petals(390,220,8,20,45,[3,4],42)); a.push(circle(390,220,18,1));
      a.push(...petals(505,295,6,24,52,[1,3],44)); a.push(circle(505,295,20,2));
      a.push(path("M220 585 Q390 535 560 585 L530 620 H250Z", 7, [390,582]));
    } else if (v === 2) {
      a.push(line(400,580,400,245,5,20));
      a.push(path("M388 455 Q265 390 225 475 Q315 520 400 490Z", 6, [310,470]));
      a.push(path("M410 390 Q525 325 590 405 Q500 450 405 430Z", 5, [500,405]));
      a.push(...petals(400,225,16,32,84,[1,2],78,5));
      a.push(circle(400,225,61,3), circle(400,225,37,4));
      for (const [x,y] of [[120,110],[675,105],[120,510],[670,505]]) a.push(circle(x,y,11,1));
    } else {
      a.push(path("M0 385 Q180 330 360 380 T800 342 V620 H0Z",4,[675,455]));
      a.push(ellipse(205,430,150,62,5), ellipse(590,455,175,68,5));
      a.push(...petals(395,295,10,35,78,[1,2,3],62,4)); a.push(circle(395,295,30,6));
      a.push(...petals(180,365,8,24,53,[1,2],46)); a.push(circle(180,365,20,6));
      a.push(...petals(625,350,8,26,58,[1,3],48)); a.push(circle(625,350,20,6));
      a.push(path("M395 355 Q330 435 250 500",5,[325,425]), path("M395 355 Q480 430 545 510",5,[475,430]));
    }
    return a;
  }

  function gardenScene(v) {
    const a = [rect(0,0,800,620,7)];
    if (v === 0) {
      a.push(path("M0 410 Q160 350 320 410 T800 365 V620 H0Z",4,[640,470]));
      a.push(rect(260,205,310,220,1,[415,330],3), poly("230,210 415,105 600,210",2,[415,175]));
      a.push(rect(380,315,70,110,5), rect(300,270,54,60,6), rect(478,270,54,60,6));
      a.push(path("M355 620 Q370 505 415 425 Q465 505 475 620Z",1,[415,540]));
      for (const [x,y,n] of [[110,440,3],[165,400,6],[660,415,3],[715,455,6],[95,530,2],[690,535,2]]) { a.push(...petals(x,y,6,11,24,[n,3],21)); a.push(circle(x,y,9,3)); }
      a.push(path("M0 520 Q120 460 250 530 V620 H0Z",5,[120,555]), path("M560 520 Q680 455 800 520 V620 H560Z",5,[680,555]));
    } else if (v === 1) {
      a.push(rect(0,390,800,230,1));
      a.push(path("M0 250 Q130 170 255 250 T530 235 T800 205 V470 H0Z",3,[690,310]));
      a.push(rect(275,180,250,350,2,[400,310],125));
      a.push(rect(315,220,170,310,7,[400,340],85));
      a.push(line(315,260,485,260,6,14), line(315,340,485,340,6,14), line(315,420,485,420,6,14));
      a.push(line(360,220,360,530,6,12), line(440,220,440,530,6,12));
      a.push(path("M0 540 Q170 460 300 540 V620 H0Z",2,[150,560]), path("M500 540 Q650 455 800 540 V620 H500Z",2,[650,560]));
      for (const [x,y] of [[250,220],[530,245],[205,330],[575,365]]) { a.push(...petals(x,y,5,12,25,[4,5],23)); a.push(circle(x,y,9,5)); }
    } else if (v === 2) {
      a.push(rect(0,410,800,210,2));
      a.push(rect(100,320,170,210,1,[185,430],10), rect(315,270,170,260,1,[400,405],10), rect(530,335,170,195,1,[615,430],10));
      a.push(ellipse(185,320,90,28,1), ellipse(400,270,90,28,1), ellipse(615,335,90,28,1));
      for (const [x,y,n] of [[145,270,3],[185,250,3],[225,280,4],[350,215,4],[400,190,3],[450,220,4],[565,285,3],[615,255,4],[665,290,3]]) a.push(circle(x,y,48,n));
      a.push(line(400,270,400,145,4,8), line(185,320,185,220,3,8), line(615,335,615,235,3,8));
      a.push(circle(690,110,52,6));
      a.push(path("M0 180 Q170 120 340 180 T800 145 V0 H0Z",7,[170,90]));
    } else {
      a.push(rect(0,390,800,230,1));
      a.push(rect(0,0,800,220,6));
      a.push(path("M0 235 L95 165 L180 232 L285 155 L390 230 L500 150 L610 230 L710 160 L800 220 V390 H0Z",7,[400,285]));
      a.push(rect(245,235,310,155,7,[400,315],4), rect(330,285,75,105,2), rect(440,265,60,60,5));
      a.push(path("M214 235 L400 125 L588 235Z",2,[400,200]));
      a.push(path("M50 520 Q120 420 180 520Z",3,[115,482]), path("M615 530 Q690 405 760 530Z",3,[690,485]));
      for (const [x,y] of [[105,430],[145,455],[650,440],[710,455]]) a.push(circle(x,y,38,4));
      a.push(path("M330 620 Q360 505 370 390 H410 Q440 505 470 620Z",7,[400,520]));
    }
    return a;
  }

  function natureScene(v) {
    const a = [rect(0,0,800,620,7)];
    if (v === 0) {
      a.push(path("M0 465 Q160 390 320 455 T800 415 V620 H0Z",5,[670,520]));
      a.push(ellipse(340,300,80,150,1,[315,280],"rotate(-28 340 300)"));
      a.push(ellipse(470,300,80,150,1,[490,280],"rotate(28 470 300)"));
      a.push(ellipse(350,390,62,105,2,[330,390],"rotate(25 350 390)"));
      a.push(ellipse(460,390,62,105,2,[480,390],"rotate(-25 460 390)"));
      a.push(ellipse(405,340,20,145,3), circle(405,205,25,3));
      a.push(circle(310,260,12,4), circle(500,260,12,4), circle(342,377,9,4), circle(468,377,9,4));
      a.push(...petals(155,430,7,16,35,[4,6],31)); a.push(circle(155,430,14,1));
      a.push(...petals(660,460,6,15,32,[4,6],29)); a.push(circle(660,460,13,1));
    } else if (v === 1) {
      a.push(path("M0 440 Q165 380 330 440 T800 400 V620 H0Z",2,[650,505]));
      a.push(ellipse(235,420,150,65,7), ellipse(625,435,145,62,7));
      a.push(ellipse(330,305,120,55,4,[330,305],"rotate(-18 330 305)"));
      a.push(ellipse(475,390,120,55,5,[475,390],"rotate(18 475 390)"));
      a.push(poly("205,300 245,270 235,330",4,[228,300]), poly("600,395 635,375 615,430",5,[615,402]));
      a.push(circle(385,245,20,4), circle(425,445,20,5));
      a.push(path("M565 245 Q665 180 730 260 Q630 325 550 275Z",7,[640,260]));
      a.push(circle(650,247,30,6), circle(675,255,12,1));
      a.push(path("M650 270 Q625 390 600 500",7,[625,385]));
    } else if (v === 2) {
      a.push(circle(660,110,55,4));
      a.push(path("M0 480 Q170 400 340 470 T800 430 V620 H0Z",6,[680,520]));
      a.push(ellipse(390,285,120,45,1,[390,285],"rotate(-20 390 285)"));
      a.push(ellipse(465,320,125,48,2,[465,320],"rotate(22 465 320)"));
      a.push(ellipse(440,300,62,46,1));
      a.push(circle(493,280,42,1));
      a.push(poly("530,280 620,300 530,308",3,[558,295]));
      a.push(circle(505,270,8,3));
      a.push(ellipse(432,337,26,20,3), ellipse(472,344,25,18,3));
      a.push(path("M565 465 Q620 360 695 390 Q650 475 565 505Z",5,[630,440]));
      a.push(...petals(610,390,6,17,34,[4,5],29)); a.push(circle(610,390,14,4));
    } else {
      a.push(circle(622,135,74,1));
      a.push(path("M0 440 L120 340 L205 412 L315 290 L430 420 L560 320 L690 410 L800 330 V620 H0Z",2,[330,390]));
      a.push(path("M0 505 Q165 440 330 505 T800 465 V620 H0Z",3,[650,520]));
      a.push(rect(140,330,250,160,4,[265,415],3), poly("112,330 265,220 420,330",3,[265,286]));
      a.push(rect(230,390,62,100,5), rect(165,375,45,50,5), rect(330,375,45,50,5));
      a.push(path("M485 500 Q500 380 550 325 Q600 390 600 500Z",6,[548,420]));
      a.push(circle(550,315,70,6));
      a.push(path("M620 540 Q650 455 700 430 Q735 480 750 540Z",6,[700,495]));
      a.push(circle(700,420,55,6));
      a.push(circle(170,110,7,7), circle(255,145,6,7), circle(390,95,8,7), circle(500,150,6,7));
    }
    return a;
  }

  const specs = [
    ["golden-hour-pup", "Golden Hour Pup", "puppies", "A sunny retriever portrait", palettes.pup1, 2, puppyScene(0)],
    ["frenchie-in-blooms", "Frenchie in Blooms", "puppies", "A sweet face among petals", palettes.pup2, 2, puppyScene(1)],
    ["dachshund-daydream", "Dachshund Daydream", "puppies", "Long ears and a soft afternoon", palettes.pup3, 2, puppyScene(2)],
    ["cozy-doodle", "Cozy Doodle", "puppies", "Curls, warmth, and quiet charm", palettes.pup4, 3, puppyScene(3)],
    ["desert-afterglow", "Desert Afterglow", "landscapes", "Sonoran silhouettes at dusk", palettes.desert, 2, landscapeScene(0)],
    ["alpine-stillness", "Alpine Stillness", "landscapes", "A mirror lake beneath snowy peaks", palettes.alpine, 3, landscapeScene(1)],
    ["tuscan-afternoon", "Tuscan Afternoon", "landscapes", "Rolling hills and a sunlit villa", palettes.tuscan, 2, landscapeScene(2)],
    ["keepers-light", "Keeper’s Light", "landscapes", "A lighthouse above the tide", palettes.coast, 3, landscapeScene(3)],
    ["peony-study", "Peony Study", "flowers", "Layered petals in dusky rose", palettes.peony, 3, flowerScene(0)],
    ["gathered-wildflowers", "Gathered Wildflowers", "flowers", "A loose bouquet from the meadow", palettes.wild, 2, flowerScene(1)],
    ["sunflower-sunday", "Sunflower Sunday", "flowers", "A bold bloom turned toward light", palettes.sun, 2, flowerScene(2)],
    ["lotus-calm", "Lotus Calm", "flowers", "Still water and opening petals", palettes.lotus, 3, flowerScene(3)],
    ["cottage-in-bloom", "Cottage in Bloom", "gardens", "A flower-lined path home", palettes.garden1, 3, gardenScene(0)],
    ["secret-garden-gate", "Secret Garden Gate", "gardens", "An ivy-covered invitation", palettes.garden2, 3, gardenScene(1)],
    ["kitchen-herb-garden", "Kitchen Herb Garden", "gardens", "Terracotta pots and fresh greens", palettes.garden3, 2, gardenScene(2)],
    ["desert-courtyard", "Desert Courtyard", "gardens", "A warm refuge of tile and agave", palettes.garden4, 3, gardenScene(3)],
    ["monarch-moment", "Monarch Moment", "nature", "A butterfly resting in the meadow", palettes.butterfly, 2, natureScene(0)],
    ["koi-pond", "Koi Pond", "nature", "Two bright currents beneath lilies", palettes.koi, 3, natureScene(1)],
    ["hummingbird-jewel", "Hummingbird Jewel", "nature", "A flash of color at the flowers", palettes.bird, 3, natureScene(2)],
    ["moonlit-companion", "Moonlit Companion", "nature", "A quiet cat beneath the stars", palettes.cat, 2, natureScene(3)]
  ];

  window.PAINT_PROJECTS = specs.map(([id, title, category, description, palette, difficulty, regions]) => ({
    id, title, category, description, palette, difficulty, regions
  }));
})();
