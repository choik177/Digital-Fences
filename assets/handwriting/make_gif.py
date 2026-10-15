from PIL import Image, ImageDraw, ImageChops
import math, random
from pathlib import Path

OUT = Path(__file__).resolve().parent
SOURCE = Path('/Users/kathrynchoi/Documents/Choi,Kathryn_2026/Choi,Kathryn_Fall 2026/Core 3_Design Studio/Project 1_Physical Form/PSD Fence/fence10_nopix.png')
# Control points use the original photograph's 1824 × 1368 preview coordinates.
strokes = [
 [(320,350),(340,313,277,302,266,345),(240,415,305,441,365,409),(465,354,581,231,665,174),(753,111,862,151,895,252),(935,350,864,428,785,416),(713,410,682,359,709,303),(738,242,792,259,805,292),(820,334,780,351,755,327)],
 [(1490,350),(1470,309,1520,300,1529,344),(1552,410,1496,428,1439,403),(1327,352,1219,230,1138,177),(1042,111,951,156,913,252),(876,345,930,426,1014,411),(1088,400,1114,355,1091,303),(1063,249,1008,256,995,291),(979,330,1022,351,1044,327)],
 [(163,446),(650,435,1170,426,1650,421)],
 [(900,431),(902,685,905,1050,909,1320)],
 [(854,657),(845,630,817,639,822,663),(827,704,890,695,892,648),(885,596,834,578,794,608),(743,645,745,707,772,759),(798,814,873,876,898,920)],
 [(949,659),(956,633,984,638,981,661),(976,704,915,694,913,650),(920,600,973,575,1013,608),(1061,643,1052,713,1025,760),(994,815,928,877,906,920)],
 [(852,958),(844,930,817,942,823,965),(833,1000,892,992,891,951),(883,905,834,882,795,907),(756,936,772,1000,798,1047),(834,1111,884,1174,905,1218)],
 [(952,957),(960,931,985,942,978,966),(967,1004,913,988,914,950),(924,905,973,879,1014,906),(1058,938,1035,1008,1008,1051),(971,1116,925,1177,905,1218)],
]

def sample(stroke):
    points = [stroke[0]]
    a = stroke[0]
    for segment in stroke[1:]:
        b,c,d = segment[:2],segment[2:4],segment[4:]
        for i in range(1,101):
            t=i/100; u=1-t
            points.append(tuple(u**3*a[k]+3*u*u*t*b[k]+3*u*t*t*c[k]+t**3*d[k] for k in (0,1)))
        a=d
    return points

paths=[sample(s) for s in strokes]
lengths=[]
for p in paths:
    acc=[0]
    for a,b in zip(p,p[1:]): acc.append(acc[-1]+math.dist(a,b))
    lengths.append(acc)
base=Image.open(SOURCE).convert('RGB').resize((912,684),Image.Resampling.LANCZOS)
palette=base.quantize(colors=255)
colors=palette.getpalette()
colors[765:768]=[255,220,143]
palette.putpalette(colors)
# A fixed impression texture keeps the ink grain still as each stroke appears.
rng=random.Random(31)
texture=Image.new('L',(1824,1368),255)
grain=ImageDraw.Draw(texture)
for _ in range(115000):
    x=rng.randrange(1824); y=rng.randrange(1368)
    radius=rng.choice([.35,.45,.6,1.0,1.5])
    grain.ellipse((x-radius,y-radius,x+radius,y+radius),fill=rng.choice([0,0,55,105]))
durations=[1.35,1.35,.5,.6,.6,.6,.55,.55]
frames=[]; delays=[]
canvas=base.copy()
frames.append(canvas.quantize(palette=palette)); delays.append(400)
for p,acc,seconds in zip(paths,lengths,durations):
    count=round(seconds*20)
    for f in range(1,count+1):
        limit=acc[-1]*f/count
        visible=[p[0]]
        for j in range(1,len(p)):
            if acc[j]<=limit: visible.append(p[j])
            else:
                t=(limit-acc[j-1])/(acc[j]-acc[j-1])
                visible.append(tuple(p[j-1][k]+(p[j][k]-p[j-1][k])*t for k in (0,1)))
                break
        mask=Image.new('L',(1824,1368))
        draw=ImageDraw.Draw(mask)
        for j,(a,b) in enumerate(zip(visible,visible[1:])):
            width=12+round(1.3*math.sin(j*.13)+.8*math.sin(j*.49))
            draw.line([a,b],fill=255,width=width)
            x,y=b; r=width/2
            draw.ellipse((x-r,y-r,x+r,y+r),fill=255)
        mask=ImageChops.multiply(mask,texture).resize(base.size,Image.Resampling.LANCZOS)
        frame=Image.composite(Image.new('RGB',base.size,(255,220,143)),canvas,mask)
        frames.append(frame.quantize(palette=palette)); delays.append(50)
    canvas=frame
    delays[-1]+=80
delays[-1]=1700
frames[0].save(OUT/'fence-handwriting.gif',save_all=True,append_images=frames[1:],duration=delays,loop=0,optimize=False,disposal=1)
canvas.save(OUT/'fence-handwriting-final.png')
print(f'Saved {len(frames)} frames, {sum(delays)/1000:.1f}s, 912 × 684')
