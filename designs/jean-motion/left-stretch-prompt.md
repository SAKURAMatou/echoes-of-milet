# Left：被摸头时舒展前身

使用内置 imagegen，参考服装母图和运行时 idle。前身下沉、前腿舒展、后脚站稳，尾巴小幅摆动。6 帧正向共 930ms，停留后反向恢复；停留时保持末帧，不持续摇尾。

处理沿用 `scripts/build_jean_motion_assets.py`，left 改为固定后脚与地面基线，允许衣服随身体倾斜。完整保留头颈，不拼接身体。最终输出透明 WebP，同步演示页和运行时资源。

## 本次完整生成提示词

Create a 1536x1024 spritesheet, exactly 3 columns by 2 rows, six equal square cells read left to right then next row. Image 1 is Jean's exact character master, image 2 is his runtime neutral standing pose. Match cream golden fur, navy solid nose and eyes, pale butter-yellow sleeveless shirt with teal trim, two bees and readable navy "Jean". Same clean soft 2D illustration and proportions.
Replace the previous left-looking motion with a gentle affectionate stretch/bow as if enjoying an unseen hand petting his head. NO human hand. Frame 1 neutral standing matching reference. Frame 2 shoulders soften and elbows bend slightly. Frame 3 front paws slide a little forward toward left, chest descends 15 percent. Frame 4 chest descends 30 percent, forelegs extend diagonally forwards. Frame 5 relaxed shallow play-bow, chest down 40 percent, head naturally follows shoulders, hind legs still standing. Frame 6 comfortable sustained bow, nose above ground, relaxed happy eyes. The neck must stay normal length: NO stretched neck, no isolated head reach, no crawling or lying fully down. Animate a modest alternating tail wag across frames 2–6 while keeping its root attached and hind paws planted. Rear feet remain at identical positions in each cell, baseline fixed. Smooth small gradual changes, same camera scale all frames, no jumping.
Keep identity and clothing design exact but let shirt bend naturally with torso. Full body including tail and paws entirely within each cell, generous margins on all sides for forward paws. Flat pure white background for script removal, no checkerboard, shadows, gridlines, labels or extra text.
