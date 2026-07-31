export class FilePicker {
  static attach(inputEl, options = {}) {
    return new FilePicker(inputEl, options);
  }

  constructor(inputEl, options) {
    this.inputEl = inputEl;
    this.label = options.label || "File";
    this.accept = options.accept || "image/png,image/jpeg,image/webp,image/svg+xml";
    this.modal = null;
    this.content = null;
    this.switchTabFn = null;
    this.files = [];
    this.setupButton();
  }

  setupButton() {
    const parent = this.inputEl.parentElement;
    const btn = parent?.querySelector(".file-picker-btn");

    btn.addEventListener("click", () => this.open());
    this.btn = btn;
  }

  open() {
    if (this.modal) return;
    this.createModal();
    document.body.appendChild(this.modal);
    document.body.style.overflow = "hidden";
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
      document.body.style.overflow = "";
    }
  }

  createModal() {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      backgroundColor: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      zIndex: "50",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });

    const panel = document.createElement("div");
    Object.assign(panel.style, {
      backgroundColor: "#171717",
      border: "1px solid rgba(168,85,247,0.1)",
      borderRadius: "0.75rem",
      maxWidth: "42rem",
      width: "100%",
      maxHeight: "80vh",
      display: "flex",
      flexDirection: "column",
    });

    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem",
      borderBottom: "1px solid rgba(168,85,247,0.1)",
    });

    const title = document.createElement("h2");
    title.textContent = "Select File";
    Object.assign(title.style, {
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#fff",
      margin: "0",
    });

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.type = "button";
    Object.assign(closeBtn.style, {
      color: "#a3a3a3",
      background: "none",
      border: "none",
      fontSize: "1.5rem",
      cursor: "pointer",
      padding: "0",
      lineHeight: "1",
    });
    closeBtn.addEventListener("mouseenter", () => { closeBtn.style.color = "#fff"; });
    closeBtn.addEventListener("mouseleave", () => { closeBtn.style.color = "#a3a3a3"; });
    closeBtn.addEventListener("click", () => this.close());

    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const tabBar = document.createElement("div");
    Object.assign(tabBar.style, {
      display: "flex",
      gap: "0.25rem",
      padding: "0.75rem 1rem 0",
    });

    const filesTab = document.createElement("button");
    filesTab.textContent = "Uploaded Files";
    filesTab.type = "button";
    filesTab.dataset.tab = "files";

    const uploadTab = document.createElement("button");
    uploadTab.textContent = "Upload New";
    uploadTab.type = "button";
    uploadTab.dataset.tab = "upload";

    const tabBtnStyle = (isActive) => ({
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      borderRadius: "0.5rem 0.5rem 0 0",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
      color: isActive ? "#d8b4fe" : "#a3a3a3",
      backgroundColor: isActive ? "rgba(147,51,234,0.2)" : "transparent",
    });

    Object.assign(filesTab.style, tabBtnStyle(true));
    Object.assign(uploadTab.style, tabBtnStyle(false));

    const switchTab = (tab) => {
      const filesActive = tab === "files";
      Object.assign(filesTab.style, tabBtnStyle(filesActive));
      Object.assign(uploadTab.style, tabBtnStyle(!filesActive));
      this.content.innerHTML = "";
      if (tab === "files") {
        this.renderFilesTab();
      } else {
        this.renderUploadTab();
      }
    };

    filesTab.addEventListener("click", () => switchTab("files"));
    uploadTab.addEventListener("click", () => switchTab("upload"));

    tabBar.appendChild(filesTab);
    tabBar.appendChild(uploadTab);
    panel.appendChild(tabBar);

    const content = document.createElement("div");
    Object.assign(content.style, {
      flex: "1",
      overflow: "auto",
      padding: "1rem",
    });
    panel.appendChild(content);

    overlay.appendChild(panel);
    this.modal = overlay;
    this.content = content;
    this.switchTabFn = switchTab;
    switchTab("files");

    const onKeyDown = (e) => {
      if (e.key === "Escape") this.close();
    };
    document.addEventListener("keydown", onKeyDown);
    this._cleanup = () => document.removeEventListener("keydown", onKeyDown);
  }

  renderFilesTab() {
    this.content.innerHTML =
      '<div style="text-align:center;padding:3rem 0;color:#737373">Loading files...</div>';
    this.loadFiles().then(() => this.renderFiles());
  }

  async loadFiles() {
    try {
      const res = await fetch("/api/admin/uploads");
      if (!res.ok) throw new Error("Failed to load");
      this.files = await res.json();
    } catch {
      this.files = [];
    }
  }

  renderFiles() {
    if (this.files.length === 0) {
      this.content.innerHTML =
        '<div style="text-align:center;padding:3rem 0;color:#737373">No files uploaded yet</div>';
      return;
    }

    const grid = document.createElement("div");
    Object.assign(grid.style, {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
      gap: "0.75rem",
    });

    for (const file of this.files) {
      const card = document.createElement("div");
      Object.assign(card.style, {
        backgroundColor: "rgba(38,38,38,0.5)",
        borderRadius: "0.5rem",
        padding: "0.5rem",
        cursor: "default",
        transition: "background-color 0.2s",
      });
      card.addEventListener("mouseenter", () => { card.style.backgroundColor = "#262626"; });
      card.addEventListener("mouseleave", () => { card.style.backgroundColor = "rgba(38,38,38,0.5)"; });

      const isImage = file.type?.startsWith("image/");
      if (isImage) {
        const img = document.createElement("img");
        img.src = file.url;
        img.alt = file.name;
        img.loading = "lazy";
        Object.assign(img.style, {
          width: "100%",
          height: "6rem",
          objectFit: "cover",
          borderRadius: "0.25rem",
          display: "block",
        });
        card.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.textContent = "FILE";
        Object.assign(placeholder.style, {
          width: "100%",
          height: "6rem",
          backgroundColor: "#262626",
          borderRadius: "0.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#737373",
          fontSize: "0.75rem",
          fontWeight: "700",
          marginBottom: "0.25rem",
        });
        card.appendChild(placeholder);
      }

      const name = document.createElement("div");
      name.textContent = file.name;
      Object.assign(name.style, {
        fontSize: "0.75rem",
        color: "#a3a3a3",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        marginTop: "0.25rem",
        marginBottom: "0.25rem",
      });

      const selectBtn = document.createElement("button");
      selectBtn.textContent = "Select";
      selectBtn.type = "button";
      Object.assign(selectBtn.style, {
        width: "100%",
        fontSize: "0.75rem",
        padding: "0.25rem 0.5rem",
        backgroundColor: "#9333ea",
        color: "#fff",
        border: "none",
        borderRadius: "0.25rem",
        cursor: "pointer",
        transition: "background-color 0.2s",
      });
      selectBtn.addEventListener("mouseenter", () => { selectBtn.style.backgroundColor = "#a855f7"; });
      selectBtn.addEventListener("mouseleave", () => { selectBtn.style.backgroundColor = "#9333ea"; });
      selectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectFile(file);
      });

      card.appendChild(name);
      card.appendChild(selectBtn);
      grid.appendChild(card);
    }

    this.content.innerHTML = "";
    this.content.appendChild(grid);
  }

  selectFile(file) {
    this.inputEl.value = file.url;
    this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    this.close();
  }

  renderUploadTab() {
    const inner = document.createElement("div");
    inner.style.cssText = "display:flex;flex-direction:column;gap:1rem";

    const label = document.createElement("label");
    Object.assign(label.style, {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#a3a3a3",
      marginBottom: "0.25rem",
    });
    label.textContent = "Select file (PNG, JPG, WebP, SVG — max 5 MB)";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = this.accept;
    Object.assign(fileInput.style, {
      width: "100%",
      color: "#fff",
    });

    const fileGroup = document.createElement("div");
    fileGroup.appendChild(label);
    fileGroup.appendChild(fileInput);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;align-items:center;gap:0.75rem";

    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button";
    uploadBtn.textContent = "Upload";
    Object.assign(uploadBtn.style, {
      padding: "0.5rem 1rem",
      backgroundColor: "#9333ea",
      color: "#fff",
      fontWeight: "500",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
      transition: "background-color 0.2s",
    });
    uploadBtn.addEventListener("mouseenter", () => { uploadBtn.style.backgroundColor = "#a855f7"; });
    uploadBtn.addEventListener("mouseleave", () => { uploadBtn.style.backgroundColor = "#9333ea"; });

    const msg = document.createElement("span");
    msg.style.display = "none";

    uploadBtn.addEventListener("click", async () => {
      const file = fileInput.files?.[0];
      if (!file) {
        msg.textContent = "Please select a file";
        msg.style.cssText = "font-size:0.875rem;color:#f87171;display:block";
        return;
      }

      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";
      msg.style.display = "none";

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok) {
          msg.textContent = data.error || "Upload failed";
          msg.style.cssText = "font-size:0.875rem;color:#f87171;display:block";
          return;
        }

        this.switchTabFn("files");
      } catch {
        msg.textContent = "Upload failed";
        msg.style.cssText = "font-size:0.875rem;color:#f87171;display:block";
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload";
      }
    });

    btnRow.appendChild(uploadBtn);
    btnRow.appendChild(msg);

    inner.appendChild(fileGroup);
    inner.appendChild(btnRow);
    this.content.appendChild(inner);
  }
}
