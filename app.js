function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function prettifyLabel(label) {
  return label.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function shouldShowVideoLabel(label) {
  const normalized = prettifyLabel(label).toLowerCase();
  return normalized === "front view" || normalized === "side view";
}

function buildPatchColumn(patches) {
  const column = createElement("div", "patch-column");
  column.appendChild(createElement("h3", "column-title", "Patch"));

  patches.forEach((src) => {
    const card = createElement("figure", "patch-card");
    const img = document.createElement("img");
    img.src = src;
    img.alt = src.split("/").pop();
    img.loading = "lazy";
    card.appendChild(img);
    column.appendChild(card);
  });

  return column;
}

function buildSingleVideoCard(video, instruction) {
  const card = createElement("div", "video-card");
  if (instruction) {
    card.appendChild(createElement("div", "video-instruction", instruction));
  }
  if (video.label && shouldShowVideoLabel(video.label)) {
    card.appendChild(createElement("div", "video-label", prettifyLabel(video.label)));
  }

  const shell = createElement("div", "video-shell");
  const player = document.createElement("video");
  player.controls = true;
  player.preload = "metadata";
  player.playsInline = true;
  const source = document.createElement("source");
  source.src = video.src;
  source.type = "video/mp4";
  player.appendChild(source);
  shell.appendChild(player);

  card.appendChild(shell);
  return card;
}

function buildClipPairCard(clips, instruction, title = "") {
  const card = createElement("div", "real-group-card");
  const stack = createElement("div", "video-stack");
  clips.forEach((clip) => {
    const instructionText = title ? `${instruction} (${title})` : instruction;
    stack.appendChild(buildSingleVideoCard(clip, instructionText));
  });
  card.appendChild(stack);
  return card;
}

function buildVideoColumn(videos, instruction) {
  const column = createElement("div", "video-column");
  column.appendChild(createElement("h3", "column-title", "Video"));

  if (!videos.length) {
    column.appendChild(createElement("div", "empty", "No video in this group."));
    return column;
  }

  videos.forEach((video) => {
    if (video.src) {
      column.appendChild(buildSingleVideoCard(video, instruction));
      return;
    }

    const group = createElement("div", "video-card");
    const stack = createElement("div", "video-stack");
    video.clips.forEach((clip) => {
      stack.appendChild(buildSingleVideoCard(clip, instruction));
    });
    group.appendChild(stack);
    column.appendChild(group);
  });

  return column;
}

function buildCaseCard(item) {
  const card = createElement("article", "case-card");
  const head = createElement("div", "case-head");
  const titleWrap = document.createElement("div");
  titleWrap.appendChild(createElement("h3", "case-title", item.title));
  head.appendChild(titleWrap);
  card.appendChild(head);

  const media = createElement("div", "media-grid");
  if ((item.patches || []).length) {
    media.appendChild(buildPatchColumn(item.patches || []));
  } else {
    media.classList.add("media-grid-single");
    if (item.slug === "reasoning_task") {
      media.classList.add("media-grid-single-centered");
    }
  }
  media.appendChild(buildVideoColumn(item.videos || [], item.instruction || ""));
  card.appendChild(media);
  return card;
}

function buildCenteredPatch(src) {
  const wrap = createElement("div", "real-patch-center");
  const card = createElement("figure", "patch-card");
  const img = document.createElement("img");
  img.src = src;
  img.alt = src.split("/").pop();
  img.loading = "lazy";
  card.appendChild(img);
  wrap.appendChild(card);
  return wrap;
}

function buildRealTaskBlock(patchSrc, groups, instruction, columnsClass, titles = []) {
  const block = createElement("article", "real-task-block");
  block.appendChild(createElement("h3", "real-task-title", "Patch"));
  block.appendChild(buildCenteredPatch(patchSrc));

  const grid = createElement("div", `real-groups-grid ${columnsClass}`);
  groups.forEach((group, index) => {
    grid.appendChild(buildClipPairCard(group.clips || [], instruction, titles[index] || ""));
  });
  block.appendChild(grid);
  return block;
}

function buildRealWorldSection(items) {
  const section = createElement("section", "section");
  const header = createElement("div", "section-header");
  const copy = document.createElement("div");
  copy.appendChild(createElement("h2", "section-title", "Real-World Results"));
  copy.appendChild(
    createElement(
      "p",
      "section-subtitle",
      "Patch images and physical attack videos are grouped into fixed layouts so each patch is followed by its corresponding real-world demonstrations."
    )
  );
  header.appendChild(copy);
  header.appendChild(createElement("div", "badge", `${items.length} tasks`));
  section.appendChild(header);

  const knife = items.find((item) => item.slug === "knife");
  const scissors = items.find((item) => item.slug === "scissors");

  if (knife) {
    const layoutPatch = (knife.patches || []).find((src) => src.includes("layout2.png"));
    const optimizedPatch = (knife.patches || []).find((src) => src.includes("optimized_patch_step_8500.png"));
    const knifeGroups = knife.videos || [];

    if (layoutPatch) {
      section.appendChild(
        buildRealTaskBlock(
          layoutPatch,
          knifeGroups.slice(0, 2),
          knife.instruction || "",
          "real-groups-grid-two"
        )
      );
    }

    if (optimizedPatch) {
      section.appendChild(
        buildRealTaskBlock(
          optimizedPatch,
          knifeGroups.slice(2, 5),
          knife.instruction || "",
          "real-groups-grid-three",
          ["Layout 1", "Layout 2", "Layout 3"]
        )
      );
    }
  }

  if (scissors) {
    const scissorsPatch = (scissors.patches || []).find((src) =>
      src.includes("optimized_patch_step_8900_scissors_0.005.png")
    );
    if (scissorsPatch) {
      section.appendChild(
        buildRealTaskBlock(
          scissorsPatch,
          scissors.videos || [],
          scissors.instruction || "",
          "real-groups-grid-two",
          ["Lighting Condition 1", "Lighting Condition 2"]
        )
      );
    }
  }

  return section;
}

function buildImageShowcaseSection(title, subtitle, imageSrc, imageAlt, compact = false, note = "") {
  const section = createElement("section", "section");
  const header = createElement("div", "section-header");
  const copy = document.createElement("div");
  copy.appendChild(createElement("h2", "section-title", title));
  copy.appendChild(createElement("p", "section-subtitle", subtitle));
  header.appendChild(copy);
  section.appendChild(header);

  const frame = createElement("div", "image-showcase");
  if (compact) {
    frame.classList.add("image-showcase-compact");
  }
  const image = document.createElement("img");
  image.src = imageSrc;
  image.alt = imageAlt;
  image.loading = "lazy";
  frame.appendChild(image);
  if (note) {
    frame.appendChild(createElement("div", "image-note", note));
  }
  section.appendChild(frame);
  return section;
}

function buildSection(title, subtitle, items) {
  const section = createElement("section", "section");
  const header = createElement("div", "section-header");
  const copy = document.createElement("div");
  copy.appendChild(createElement("h2", "section-title", title));
  copy.appendChild(createElement("p", "section-subtitle", subtitle));
  header.appendChild(copy);
  header.appendChild(createElement("div", "badge", `${items.length} groups`));
  section.appendChild(header);

  const grid = createElement("div", "case-grid");
  items.forEach((item) => grid.appendChild(buildCaseCard(item)));
  section.appendChild(grid);
  return section;
}

function renderApp() {
  const app = document.getElementById("app");
  const data = window.GALLERY_DATA || { simulation: [], real: [] };

  app.appendChild(
    buildImageShowcaseSection(
      "Method Flowchart",
      "A high-level diagram of the full adversarial patch workflow.",
      "web/flowchart/method.png",
      "Workflow flowchart"
    )
  );

  app.appendChild(
    buildSection(
      "Simulation Results",
      "Each case shows the available patch image, attack video, and task instruction overlayed onto the video frame area.",
      data.simulation
    )
  );

  app.appendChild(
    buildImageShowcaseSection(
      "Patch Relative Size",
      "A visual comparison of human scale and patch scale used in the real-world setup.",
      "web/human_and_patch/mask_patch.jpg",
      "Human and patch size comparison",
      true,
      "Patch physical size: 57 cm x 43 cm"
    )
  );

  app.appendChild(
    buildRealWorldSection(data.real)
  );
}

renderApp();
