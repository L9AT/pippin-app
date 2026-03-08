document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('collabApplyForm');
    const formContainer = document.getElementById('formContainer');
    const successState = document.getElementById('successState');
    const submitBtn = document.getElementById('submitBtn');

    // UI Event Listeners
    const mintDateInput = document.getElementById('mintDate');
    const mintTbaCheck = document.getElementById('mintTba');

    if (mintTbaCheck && mintDateInput) {
        mintTbaCheck.addEventListener('change', (e) => {
            if (e.target.checked) {
                mintDateInput.disabled = true;
                mintDateInput.value = '';
                mintDateInput.required = false;
            } else {
                mintDateInput.disabled = false;
                mintDateInput.required = true;
            }
        });
    }

    const wlCheck = document.getElementById('wlCheck');
    const wlSpotsGroup = document.getElementById('wlSpotsGroup');
    const wlSpotsInput = document.getElementById('wlSpots');

    if (wlCheck) {
        wlCheck.addEventListener('change', (e) => {
            if (e.target.checked) {
                wlSpotsGroup.classList.remove('hidden-field');
                wlSpotsGroup.classList.add('visible-field');
                wlSpotsInput.required = true;
            } else {
                wlSpotsGroup.classList.remove('visible-field');
                wlSpotsGroup.classList.add('hidden-field');
                wlSpotsInput.required = false;
                wlSpotsInput.value = '';
            }
        });
    }

    const gtdCheck = document.getElementById('gtdCheck');
    const gtdSpotsGroup = document.getElementById('gtdSpotsGroup');
    const gtdSpotsInput = document.getElementById('gtdSpots');

    if (gtdCheck) {
        gtdCheck.addEventListener('change', (e) => {
            if (e.target.checked) {
                gtdSpotsGroup.classList.remove('hidden-field');
                gtdSpotsGroup.classList.add('visible-field');
                gtdSpotsInput.required = true;
            } else {
                gtdSpotsGroup.classList.remove('visible-field');
                gtdSpotsGroup.classList.add('hidden-field');
                gtdSpotsInput.required = false;
                gtdSpotsInput.value = '';
            }
        });
    }

    // Custom Chain Dropdown Logic
    const chainSelectGroup = document.getElementById('chainSelectGroup');
    const chainSelect = document.getElementById('chainCustomSelect');
    const chainDisplay = document.getElementById('chainDisplay');
    const chainDisplaySpan = chainDisplay ? chainDisplay.querySelector('span') : null;
    const chainOptions = document.querySelectorAll('.custom-option');
    const chainHiddenInput = document.getElementById('chain');
    const otherChainGroup = document.getElementById('otherChainGroup');
    const otherChainInput = document.getElementById('otherChain');
    const chainSearch = document.getElementById('chainSearch');

    if (chainSelect) {
        let highlightIndex = -1;

        function getVisibleOptions() {
            return Array.from(chainOptions).filter(opt => !opt.classList.contains('hidden-option'));
        }

        function updateHighlight() {
            const visible = getVisibleOptions();
            chainOptions.forEach(opt => opt.classList.remove('focused'));
            if (highlightIndex >= 0 && highlightIndex < visible.length) {
                visible[highlightIndex].classList.add('focused');
            }
        }

        chainDisplay.addEventListener('click', (e) => {
            chainSelect.classList.toggle('active');
            if (chainSelect.classList.contains('active')) {
                chainSearch.value = '';
                chainOptions.forEach(opt => opt.classList.remove('hidden-option'));
                highlightIndex = -1;
                updateHighlight();
                setTimeout(() => chainSearch.focus(), 50);
            }
        });

        document.addEventListener('click', (e) => {
            if (chainSelectGroup && !chainSelectGroup.contains(e.target)) {
                chainSelect.classList.remove('active');
            }
        });

        if (chainSearch) {
            chainSearch.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                chainOptions.forEach(opt => {
                    const text = opt.innerText.toLowerCase();
                    if (text.includes(term)) {
                        opt.classList.remove('hidden-option');
                    } else {
                        opt.classList.add('hidden-option');
                    }
                });
                highlightIndex = -1;
                updateHighlight();
            });
        }

        chainSelect.addEventListener('keydown', (e) => {
            if (!chainSelect.classList.contains('active')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    chainSelect.classList.add('active');
                    chainSearch.value = '';
                    chainOptions.forEach(opt => opt.classList.remove('hidden-option'));
                    setTimeout(() => chainSearch.focus(), 50);
                }
                return;
            }

            const visible = getVisibleOptions();

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightIndex = highlightIndex < visible.length - 1 ? highlightIndex + 1 : 0;
                updateHighlight();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightIndex = highlightIndex > 0 ? highlightIndex - 1 : visible.length - 1;
                updateHighlight();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightIndex >= 0 && highlightIndex < visible.length) {
                    visible[highlightIndex].click();
                } else if (visible.length === 1) {
                    // Auto select if only 1 match
                    visible[0].click();
                }
            } else if (e.key === 'Escape') {
                chainSelect.classList.remove('active');
                chainSelect.focus(); // return focus to select container
            }
        });

        chainOptions.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                chainHiddenInput.value = value;
                chainDisplaySpan.innerHTML = option.innerHTML;
                chainSelect.classList.remove('active');
                chainSelect.focus();

                // Clear previously required styling wrapper effect
                chainSelect.style.borderColor = '';

                // Handle 'Other' blockchain reveal
                if (value === 'Other') {
                    otherChainGroup.classList.remove('hidden-field');
                    otherChainGroup.classList.add('visible-field');
                    otherChainInput.required = true;
                    setTimeout(() => otherChainInput.focus(), 150);
                } else {
                    otherChainGroup.classList.remove('visible-field');
                    otherChainGroup.classList.add('hidden-field');
                    otherChainInput.required = false;
                    otherChainInput.value = '';
                }
            });
        });
    }

    // Cropping System State
    let currentCropper = null;
    let pendingImageAction = null; // Store callback for when crop is confirmed

    const cropModal = document.getElementById('cropModal');
    const imageToCrop = document.getElementById('imageToCrop');
    const zoomSlider = document.getElementById('zoomSlider');
    const cancelCropBtn = document.getElementById('cancelCrop');
    const confirmCropBtn = document.getElementById('confirmCrop');

    function openCropModal(file, aspectRatio, onConfirm) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageToCrop.src = e.target.result;
            cropModal.classList.add('active');

            if (currentCropper) {
                currentCropper.destroy();
            }

            currentCropper = new Cropper(imageToCrop, {
                aspectRatio: aspectRatio,
                viewMode: 1,
                dragMode: 'move',
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                background: false,
                ready() {
                    zoomSlider.value = 0;
                },
                zoom(e) {
                    // Update zoom slider if changed via mouse wheel
                    zoomSlider.value = e.detail.ratio;
                }
            });

            pendingImageAction = onConfirm;
        };
        reader.readAsDataURL(file);
    }

    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            if (currentCropper) {
                currentCropper.zoomTo(e.target.value);
            }
        });
    }

    if (cancelCropBtn) {
        cancelCropBtn.addEventListener('click', () => {
            closeCropModal();
        });
    }

    if (confirmCropBtn) {
        confirmCropBtn.addEventListener('click', () => {
            if (currentCropper && pendingImageAction) {
                pendingImageAction();
            }
            closeCropModal();
        });
    }

    function closeCropModal() {
        cropModal.classList.remove('active');
        if (currentCropper) {
            currentCropper.destroy();
            currentCropper = null;
        }
        pendingImageAction = null;
        imageToCrop.src = '';
    }

    // Image Upload & Preview Logic
    function setupImagePreview(inputId, labelId, containerId, previewId, removeBtnId, requiredDim, dimPreviewId) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId);
        const container = document.getElementById(containerId);
        const preview = document.getElementById(previewId);
        const removeBtn = document.getElementById(removeBtnId);
        const dimPreview = document.getElementById(dimPreviewId);

        if (!input) return;

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) startCropFlow(file);
        });

        // Drag & Drop Handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            label.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            label.addEventListener(eventName, () => label.classList.add('dragging'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            label.addEventListener(eventName, () => label.classList.remove('dragging'), false);
        });

        label.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            if (file) startCropFlow(file);
        });

        function startCropFlow(file) {
            // Initial Validation: Format & Original Size
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert('Invalid file format. Please upload a PNG, JPG, or WEBP image.');
                input.value = '';
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // Slightly higher limit for original before crop
                alert('Original file is too large. Max size is 10MB.');
                input.value = '';
                return;
            }

            const aspectRatio = requiredDim.width / requiredDim.height;

            openCropModal(file, aspectRatio, () => {
                // On Crop Confirm
                const canvas = currentCropper.getCroppedCanvas({
                    width: requiredDim.width,
                    height: requiredDim.height,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });

                canvas.toBlob((blob) => {
                    // Check if blob size is within 5MB
                    if (blob.size > 5 * 1024 * 1024) {
                        alert('Processed image is still too large. Please try a different image or smaller crop.');
                        return;
                    }

                    const croppedFile = new File([blob], file.name, { type: 'image/jpeg' });

                    // Display preview
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        preview.src = re.target.result;
                        label.style.display = 'none';
                        container.style.display = 'block';
                        if (dimPreview) {
                            dimPreview.textContent = `${requiredDim.width}x${requiredDim.height}px ✓`;
                            dimPreview.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(croppedFile);

                    // Update input files with cropped version
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(croppedFile);
                    input.files = dataTransfer.files;

                }, 'image/jpeg', 0.9);
            });
        }

        removeBtn.addEventListener('click', () => {
            input.value = '';
            preview.src = '';
            container.style.display = 'none';
            label.style.display = 'flex';
            if (dimPreview) dimPreview.style.display = 'none';
        });
    }

    // Initialize individual previews with strict dimensions
    setupImagePreview('avatarInput', 'avatarLabel', 'avatarPreviewContainer', 'avatarPreview', 'removeAvatar', { width: 500, height: 500 }, 'avatarDimPreview');
    setupImagePreview('bannerInput', 'bannerLabel', 'bannerPreviewContainer', 'bannerPreview', 'removeBanner', { width: 1500, height: 500 }, 'bannerDimPreview');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Disable button
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;

            const projectName = document.getElementById('projectName').value;
            const website = document.getElementById('website').value;
            const twitter = document.getElementById('twitterLink').value;
            const discord = document.getElementById('discordLink').value;
            let chain = document.getElementById('chain').value;
            const supply = parseInt(document.getElementById('supply').value) || 0;
            const mintTba = document.getElementById('mintTba').checked;
            const mintDate = mintTba ? null : document.getElementById('mintDate').value;
            const followers = parseInt(document.getElementById('twitterFollowers').value) || 0;
            const description = document.getElementById('description').value;

            const avatarInput = document.getElementById('avatarInput');
            const bannerInput = document.getElementById('bannerInput');
            const avatarFile = avatarInput ? avatarInput.files[0] : null;
            const bannerFile = bannerInput ? bannerInput.files[0] : null;

            // Manual Validation for Images
            if (!avatarFile || !bannerFile) {
                alert('Please upload and crop both a Project Avatar and a Project Banner.');
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Chain validation
            if (!chain) {
                alert('Please select a blockchain.');
                if (chainSelect) chainSelect.style.border = '1px solid #dc2626';
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            if (chain === 'Other') {
                chain = document.getElementById('otherChain').value;
                if (!chain) {
                    alert('Please specify the blockchain.');
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }
            }

            // Spots validation
            const isWl = document.getElementById('wlCheck')?.checked;
            const isGtd = document.getElementById('gtdCheck')?.checked;

            if (!isWl && !isGtd) {
                alert('Please select at least one type of spots to offer (WL or GTD).');
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            const wlSpots = isWl ? (parseInt(document.getElementById('wlSpots').value) || 0) : 0;
            const gtdSpots = isGtd ? (parseInt(document.getElementById('gtdSpots').value) || 0) : 0;
            const totalSpots = wlSpots + gtdSpots;

            if (totalSpots <= 0) {
                alert('Please enter a valid number of spots greater than 0.');
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Score calculation logic
            let score = 0;
            if (followers > 100000) score += 50;
            else if (followers > 50000) score += 40;
            else if (followers > 25000) score += 30;
            else if (followers > 10000) score += 20;
            else if (followers > 5000) score += 10;
            else if (followers > 1000) score += 5;

            if (totalSpots >= 100) score += 30;
            else if (totalSpots >= 50) score += 25;
            else if (totalSpots >= 25) score += 15;
            else if (totalSpots >= 10) score += 10;
            else if (totalSpots > 0) score += 5;

            if (supply > 0 && supply <= 1000) score += 20;
            else if (supply > 0 && supply <= 3333) score += 15;
            else if (supply > 0 && supply <= 5555) score += 10;
            else if (supply > 0 && supply <= 10000) score += 5;

            score = Math.min(score, 100);

            let coll_type = [];
            if (isWl) coll_type.push('WL');
            if (isGtd) coll_type.push('GTD');

            // Post to Supabase
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                try {
                    const uploadImage = async (file, folder) => {
                        const fileExt = 'jpg';
                        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `${folder}/${fileName}`;

                        const { error: uploadError } = await supabaseClient.storage
                            .from('collaboration-assets')
                            .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabaseClient.storage
                            .from('collaboration-assets')
                            .getPublicUrl(filePath);

                        return publicUrl;
                    };

                    const [avatarUrl, bannerUrl] = await Promise.all([
                        uploadImage(avatarFile, 'avatars'),
                        uploadImage(bannerFile, 'banners')
                    ]);

                    const payload = {
                        project_name: projectName,
                        website: website,
                        twitter: twitter,
                        discord_url: discord,
                        avatar_url: avatarUrl,
                        banner_url: bannerUrl,
                        twitter_followers: followers,
                        chain: chain,
                        supply: supply,
                        mint_date: mintTba ? null : (mintDate ? mintDate : null),
                        tba: mintTba,
                        description: description,
                        collaboration_type: coll_type.join(' & '),
                        wl_spots: wlSpots,
                        gtd_spots: gtdSpots,
                        spots_offered: totalSpots,
                        quality_score: score,
                        status: 'pending'
                    };

                    const { error } = await supabaseClient
                        .from('collaboration_applications')
                        .insert([payload]);

                    if (error) {
                        console.error('Submission error:', error);
                        alert('Error: ' + error.message);
                        submitBtn.innerText = originalBtnText;
                        submitBtn.disabled = false;
                        return;
                    }
                } catch (err) {
                    console.error('Submission error:', err);
                    alert('Submission error: ' + err.message);
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }
            } else {
                alert('Database connection not established.');
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            formContainer.style.display = 'none';
            successState.style.display = 'block';
        });
    }
});
