---
title: "CT Image Inpainting Research"       # card heading + timeline label + list title
type: experience                    # one of: project | competition | work | experience  (drives color/icon + grouping)
role: "Undergraduate Research Assistant"          # shown in List squircle and detail card
org: "Dynamic Medical Image and Computing Lab"
start: 2025-02                      # timeline placement + timespan display
end: present                        # or the literal: present
---

Problem Statement: 4D CT images are known to contain artifacts due to patient breathing/motion. These artifacts may include mis-negatives, mis-positives, duplications, or interpolations. There are already published methods on identifying these artifacts, but in-painting the CT artifacts is still a less covered, but equally valuable area of research. 

My Contribution: In-painting the full image is extremely challenging, so my research focused just on the vasculature because if even this is corrected, it allows for clinically significant information to be extracted from the image. Namely, perfusion metrics can be computed from this corrected vasculature. As part of Dr. Edward Castillo's Dynamic Computation and Medical Imaging Lab. I focused on developing deep learning models to correct vessel segmentations from artifact ridden 4D lung CT images through in-painting. Models include VAEs, VQVAEs, UNets with partial convolution layers