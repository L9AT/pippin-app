if (!supabaseClient) {
    // Run in placeholder mode for visual tests
    console.warn("Running admin in dry-run mode (no Supabase config).");
    setTimeout(renderMockTable, 500);
} else {
    (async () => {
        // fetch initial data
        fetchCollabs();
        fetchApps();
        setupRealtime();
    })();
}

function setupRealtime() {
    if (!supabaseClient) return;

    supabaseClient
        .channel('admin-collaborations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborations' }, payload => {
            console.log('Realtime collaborations:', payload);
            fetchCollabs();
        })
        .subscribe();

    supabaseClient
        .channel('admin-applications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collaboration_applications' }, payload => {
            console.log('Realtime applications:', payload);
            fetchApps();
        })
        .subscribe();
}

// LOGOUT
document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    window.location.href = 'admin-login.html';
});

// DATA
let collabs = [];

async function fetchCollabs() {
    try {
        const { data, error } = await supabaseClient
            .from('collaborations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        collabs = data || [];
        renderTable();
    } catch (err) {
        console.error(err);
        alert('Error fetching collaborations. Check console.');
    }
}

function renderTable() {
    const tbody = document.getElementById('collabTableBody');
    tbody.innerHTML = '';

    if (collabs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No collaborations found. Add one above!</td></tr>`;
        return;
    }

    collabs.forEach(c => {
        const tr = document.createElement('tr');
        const statusClass = c.status === 'live' ? 'status-live' : (c.status === 'soon' ? 'status-soon' : 'status-closed');
        const statusLabel = c.status === 'live' ? 'Live' : (c.status === 'soon' ? 'Coming Soon' : 'Closed');

        let spotsText = [];
        if (c.wl_spots) spotsText.push(`${c.wl_spots} WL`);
        if (c.gtd_spots) spotsText.push(`${c.gtd_spots} GTD`);
        const spotsDisplay = spotsText.length > 0 ? spotsText.join(' + ') : (c.spots || '—');

        const drawBtnHTML = c.status === 'live' ? `<button class="btn-draw" onclick="drawWinners('${c.id}')">Draw Winners</button>` : '';

        tr.innerHTML = `
            <td>
                ${c.banner_url ? `<img src="${c.banner_url}" class="thumb" />` : '<div class="thumb" style="background:#e5e7eb"></div>'}
            </td>
            <td>
                <span class="collab-name">${c.name}</span>
                <span class="collab-slug">/${c.slug}</span>
            </td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td>${c.mint_date || '—'}</td>
            <td>${spotsDisplay}</td>
            <td class="actions">
                ${drawBtnHTML}
                <button class="btn-edit" onclick="editCollab('${c.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteCollab('${c.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMockTable() {
    // Mock data removed to ensure strictly live Supabase data
    return;
}

window.drawWinners = async (collabId) => {
    const modal = document.getElementById('winnersModal');
    const content = document.getElementById('winnersContent');
    modal.classList.add('active');

    // Find collab data
    const collab = collabs.find(c => c.id === collabId);
    if (!collab) {
        content.innerHTML = '<p>Error loading collaboration data.</p>';
        return;
    }

    content.innerHTML = `<div style="text-align:center; padding: 2rem;"><p>⚙️ Analyzing participant data & blockchain entries...</p></div>`;

    setTimeout(() => {
        // --- Distribution Engine ---
        // 1. Generate MOCK Participants (Since we don't have real entries hooked up yet)
        const totalMockParticipants = 150;
        let pool = [];
        for (let i = 0; i < totalMockParticipants; i++) {
            const base = Math.floor(Math.random() * 50) + 10;
            const hasNft = Math.random() > 0.4;
            const mult = hasNft ? (Math.random() * 2 + 1) : 1;
            const finalPoints = Math.round(base * mult);
            pool.push({
                wallet: '0x' + Math.random().toString(16).substring(2, 8) + '...' + Math.random().toString(16).substring(2, 6),
                base: base,
                multiplier: mult.toFixed(1),
                final_points: finalPoints
            });
        }

        // 2. Sort pool by final_points DESC
        pool.sort((a, b) => b.final_points - a.final_points);

        const winners = [];

        // 3. Assign GTD Spots
        const gtdLimit = parseInt(collab.gtd_spots) || 0;
        const wlLimit = parseInt(collab.wl_spots) || 0;

        for (let i = 0; i < gtdLimit && pool.length > 0; i++) {
            const winner = pool.shift(); // Remove top
            winners.push({ ...winner, type: 'GTD' });
        }

        // 4. Assign WL Spots via Weighted Random Selection
        for (let i = 0; i < wlLimit && pool.length > 0; i++) {
            // Recalculate total points remaining
            const totalPoints = pool.reduce((sum, p) => sum + p.final_points, 0);
            let randomTick = Math.random() * totalPoints;

            let selectedIndex = 0;
            for (let j = 0; j < pool.length; j++) {
                randomTick -= pool[j].final_points;
                if (randomTick <= 0) {
                    selectedIndex = j;
                    break;
                }
            }

            const winner = pool.splice(selectedIndex, 1)[0];
            winners.push({ ...winner, type: 'WL' });
        }

        // Print to Admin Modal
        let html = `
            <div style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.1rem; color: #111827;">${collab.name} Giveaway Done</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Processed ${totalMockParticipants} total entries.</p>
                </div>
                <div style="text-align: right;">
                    <span style="display:inline-block; margin-right: 0.5rem;" class="winner-gtd">${gtdLimit} GTD Drawn</span>
                    <span class="winner-wl">${wlLimit} WL Drawn</span>
                </div>
            </div>
            
            <table class="winners-table">
                <thead>
                    <tr>
                        <th style="width: 25%">Wallet</th>
                        <th style="width: 25%">Final Points</th>
                        <th style="width: 25%">Breakdown</th>
                        <th style="width: 25%">Result</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (winners.length === 0) {
            html += `<tr><td colspan="4">No winners to select.</td></tr>`;
        } else {
            winners.forEach(w => {
                const tag = w.type === 'GTD' ? `<span class="winner-gtd">GTD</span>` : `<span class="winner-wl">WL</span>`;
                html += `
                    <tr>
                        <td style="font-family: monospace; font-size: 0.95rem;">${w.wallet}</td>
                        <td style="font-weight: 600;">${w.final_points} <span style="font-weight: 400; color: #6b7280; font-size: 0.75rem;">PTS</span></td>
                        <td style="color: #6b7280; font-size: 0.8rem;">${w.base} base × ${w.multiplier}x</td>
                        <td>${tag}</td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        content.innerHTML = html;

        // Permanent Store Simulation
        if (!supabaseClient) {
            localStorage.setItem('mockWinners_' + collab.id, JSON.stringify(winners));
        } else {
            // supabase insert logic here eventually 
        }

    }, 1200);
};

// ==== APPLICATIONS TABS & LOGIC ====
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    if (tab === 'collabs') {
        document.getElementById('tabCollabs').classList.add('active');
        document.getElementById('collabsTab').classList.add('active');
    } else {
        document.getElementById('tabApps').classList.add('active');
        document.getElementById('applicationsTab').classList.add('active');
        if (apps.length === 0) fetchApps(); // fetch if needed
    }
};

let apps = [];

async function fetchApps() {
    if (!supabaseClient) return; // Mock is handled

    try {
        const { data, error } = await supabaseClient
            .from('collaboration_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        apps = data || [];
        renderApps();
    } catch (err) {
        console.error(err);
    }
}

window.filterApps = () => {
    renderApps();
};

function renderApps() {
    const tbody = document.getElementById('appTableBody');
    const scoreFilter = document.getElementById('scoreFilter') ? document.getElementById('scoreFilter').value : 'all';
    const statusFilter = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'all';
    tbody.innerHTML = '';

    let visibleApps = apps;

    // Apply Status Filter
    if (statusFilter !== 'all') {
        visibleApps = visibleApps.filter(a => (a.status || 'pending').toLowerCase() === statusFilter);
    }

    // Apply Score Filter
    if (scoreFilter === 'high') visibleApps = visibleApps.filter(a => a.quality_score >= 70);
    else if (scoreFilter === 'medium') visibleApps = visibleApps.filter(a => a.quality_score >= 40 && a.quality_score < 70);
    else if (scoreFilter === 'low') visibleApps = visibleApps.filter(a => a.quality_score < 40);

    if (visibleApps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="empty-state">No applications found with selected filters.</td></tr>`;
        return;
    }

    visibleApps.forEach(a => {
        const tr = document.createElement('tr');
        const currentStatus = (a.status || 'pending').toLowerCase();

        // Status Badge
        let statusClass = 'status-pending';
        let statusLabel = 'Pending';
        if (currentStatus === 'approved') { statusClass = 'status-approved'; statusLabel = 'Approved'; }
        if (currentStatus === 'rejected') { statusClass = 'status-rejected'; statusLabel = 'Rejected'; }

        // Action Buttons
        let actions = '';
        if (currentStatus === 'pending') {
            actions = `
                <button class="btn-approve" onclick="approveApp('${a.id}')">Approve</button>
                <button class="btn-reject" onclick="rejectApp('${a.id}')">Reject</button>
                <button style="color:#6b7280;margin-left:0.5rem;background:none;border:none;cursor:pointer;font-weight:500" onclick="addNote('${a.id}')">Notes</button>
            `;
        } else {
            actions = `<span style="font-size:0.8rem;color:#9ca3af;">—</span>
                       <button style="color:#6b7280;margin-left:0.5rem;background:none;border:none;cursor:pointer;font-weight:500" onclick="addNote('${a.id}')">Notes</button>`;
        }

        // Format Date
        const createdAt = a.created_at ? new Date(a.created_at).toLocaleDateString() : '—';
        const mintDateDisplay = a.tba ? 'TBA' : (a.mint_date || '—');

        tr.innerHTML = `
            <td>
                ${a.avatar_url ? `<img src="${a.avatar_url}" class="thumb" style="width:60px;height:60px;border-radius:4px;" />` : `<div class="thumb" style="width:60px;height:60px;background:#f3f4f6;border-radius:4px;"></div>`}
            </td>
            <td>
                ${a.banner_url ? `<img src="${a.banner_url}" class="thumb" style="width:120px;height:40px;border-radius:4px;" />` : `<div class="thumb" style="width:120px;height:40px;background:#f3f4f6;border-radius:4px;"></div>`}
            </td>
            <td>
                <span class="collab-name">${a.project_name}</span>
                <div style="font-size:0.75rem; color:#6b7280; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${a.description || ''}">
                    ${a.description || 'No description'}
                </div>
            </td>
            <td>
                <div style="display:flex; flex-direction:column; gap:0.25rem;">
                    ${a.website ? `<a href="${a.website}" target="_blank" style="font-size:0.75rem;color:#4f46e5;text-decoration:none;">Website ↗</a>` : ''}
                    ${a.twitter ? `<a href="${a.twitter}" target="_blank" style="font-size:0.75rem;color:#4f46e5;text-decoration:none;">Twitter ↗</a>` : ''}
                    ${a.discord_url ? `<a href="${a.discord_url}" target="_blank" style="font-size:0.75rem;color:#4f46e5;text-decoration:none;">Discord ↗</a>` : ''}
                </div>
            </td>
            <td>
                <div style="font-size:0.9rem; font-weight:500;">${a.chain || '—'}</div>
                <div style="font-size:0.8rem;color:#6b7280;margin-top:2px;">Supply: ${a.supply || '—'}</div>
            </td>
            <td>
                <div style="font-size:0.9rem;">${mintDateDisplay}</div>
            </td>
            <td>
                <div style="font-size:0.9rem;">${a.wl_spots || 0} WL</div>
                <div style="font-size:0.9rem;">${a.gtd_spots || 0} GTD</div>
            </td>
            <td>
                <strong style="color: ${a.quality_score >= 70 ? '#16a34a' : (a.quality_score >= 40 ? '#ca8a04' : '#dc2626')}; font-size:1.1rem;">
                    ${a.quality_score || 0}
                </strong>
            </td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td style="font-size:0.85rem; color:#6b7280;">${createdAt}</td>
            <td class="actions">${actions}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.approveApp = async (id) => {
    if (!confirm('Approve this application? This will create a LIVE collaboration.')) return;

    const app = apps.find(x => x.id === id);
    if (!app) return;

    // Slug generation
    const slug = app.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const collabPayload = {
        name: app.project_name,
        slug: slug,
        status: 'live',
        is_live: true,
        mint_date: app.mint_date || null,
        tba: app.tba || false,
        supply: app.supply || null,
        chain: app.chain || null,
        wl_spots: app.wl_spots || null,
        gtd_spots: app.gtd_spots || null,
        spots: app.spots_offered || 0,
        description: app.description || null,
        collaboration_type: app.collaboration_type || null,
        avatar_url: app.avatar_url || null,
        logo_url: app.avatar_url || null, // legacy support
        banner_url: app.banner_url || null,
        discord_url: app.discord_url || null,
        website: app.website || null,
        twitter: app.twitter || null,
        quality_score: app.quality_score || 0
    };

    if (!supabaseClient) {
        // Mock
        app.status = 'approved';
        collabs.unshift({ id: Date.now().toString(), ...collabPayload });
        localStorage.setItem('mockApps', JSON.stringify(apps));
        localStorage.setItem('mockCollabs', JSON.stringify(collabs));
        renderApps();
        renderTable();
        return;
    }

    try {
        // 1. Insert into collaborations
        const { error: insertErr } = await supabaseClient.from('collaborations').insert(collabPayload);
        if (insertErr) throw insertErr;

        // 2. Update app status
        const { error: updateErr } = await supabaseClient.from('collaboration_applications').update({ status: 'approved' }).eq('id', id);
        if (updateErr) throw updateErr;

        fetchApps();
        fetchCollabs();
        alert('Application approved and added to collaborations!');
    } catch (err) {
        console.error(err);
        alert('Error approving application: ' + err.message);
    }
};

window.rejectApp = async (id) => {
    if (!confirm('Reject this application?')) return;

    if (!supabaseClient) {
        const app = apps.find(x => x.id === id);
        if (app) app.status = 'rejected';
        localStorage.setItem('mockApps', JSON.stringify(apps));
        renderApps();
        return;
    }

    try {
        const { error } = await supabaseClient.from('collaboration_applications').update({ status: 'rejected' }).eq('id', id);
        if (error) throw error;
        fetchApps();
    } catch (err) {
        console.error(err);
        alert('Error rejecting: ' + err.message);
    }
};

window.addNote = async (id) => {
    const app = apps.find(x => x.id === id);
    if (!app) return;

    let existing = app.internal_notes || '';
    const note = prompt('Add internal note for ' + app.project_name + ':', existing);
    if (note === null) return; // cancelled

    if (!supabaseClient) {
        app.internal_notes = note;
        localStorage.setItem('mockApps', JSON.stringify(apps));
        alert('Mock note saved: ' + note);
        return;
    }

    try {
        const { error } = await supabaseClient.from('collaboration_applications').update({ internal_notes: note }).eq('id', id);
        if (error) throw error;

        app.internal_notes = note;
        alert('Note saved to application.');
    } catch (err) {
        console.error(err);
        alert('Error saving note: ' + err.message);
    }
};


// MODAL CONTROLS
const modal = document.getElementById('collabModal');
const form = document.getElementById('collabForm');

document.getElementById('openAddModal').addEventListener('click', () => {
    form.reset();
    document.getElementById('collabId').value = '';
    document.getElementById('modalTitle').innerText = 'Add New Collaboration';
    modal.classList.add('active');
});

const closeModal = () => modal.classList.remove('active');
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);

window.editCollab = (id) => {
    const c = collabs.find(x => x.id === id);
    if (!c) return;

    document.getElementById('collabId').value = c.id;
    document.getElementById('name').value = c.name;
    document.getElementById('slug').value = c.slug;
    document.getElementById('status').value = c.status;
    document.getElementById('mint_date').value = c.mint_date || '';
    document.getElementById('supply').value = c.supply || '';
    document.getElementById('chain').value = c.chain || '';
    document.getElementById('wl_spots').value = c.wl_spots || '';
    document.getElementById('gtd_spots').value = c.gtd_spots || '';
    document.getElementById('description').value = c.description || '';

    document.getElementById('modalTitle').innerText = 'Edit Collaboration';
    modal.classList.add('active');
};


// DB ACTIONS
window.deleteCollab = async (id) => {
    if (!confirm('Are you sure you want to delete this collaboration permanently?')) return;

    if (!supabaseClient) {
        collabs = collabs.filter(c => c.id !== id);
        localStorage.setItem('mockCollabs', JSON.stringify(collabs));
        renderTable();
        return;
    }

    try {
        const { error } = await supabaseClient.from('collaborations').delete().eq('id', id);
        if (error) throw error;
        fetchCollabs();
    } catch (err) {
        alert('Error deleting: ' + err.message);
    }
};

async function uploadFile(file, folder) {
    if (!supabaseClient) return 'https://via.placeholder.com/600x200'; // Mock return

    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: uploadErr } = await supabaseClient.storage
        .from('collaboration-assets')
        .upload(fileName, file);

    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabaseClient.storage
        .from('collaboration-assets')
        .getPublicUrl(fileName);

    return publicUrl;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.innerText = 'Saving...';
    btn.disabled = true;

    try {
        const id = document.getElementById('collabId').value;
        const wl_spots = parseInt(document.getElementById('wl_spots').value) || 0;
        const gtd_spots = parseInt(document.getElementById('gtd_spots').value) || 0;
        const status = document.getElementById('status').value;
        const mint_date_val = document.getElementById('mint_date').value;

        const payload = {
            name: document.getElementById('name').value,
            slug: document.getElementById('slug').value,
            status: status,
            mint_date: mint_date_val && mint_date_val.toLowerCase() !== 'tba' ? mint_date_val : null,
            tba: mint_date_val && mint_date_val.toLowerCase() === 'tba' ? true : false,
            supply: document.getElementById('supply').value || null,
            chain: document.getElementById('chain').value || null,
            wl_spots: wl_spots || null,
            gtd_spots: gtd_spots || null,
            spots: wl_spots + gtd_spots,
            description: document.getElementById('description').value || null,
            is_live: status === 'live'
        };

        const bannerFile = document.getElementById('bannerFile').files[0];
        const logoFile = document.getElementById('logoFile').files[0];

        if (bannerFile) {
            payload.banner_url = await uploadFile(bannerFile, 'banners');
        }
        if (logoFile) {
            const url = await uploadFile(logoFile, 'avatars');
            payload.logo_url = url;
            payload.avatar_url = url;
        }

        if (!supabaseClient) {
            // Mock Save
            if (id) {
                const idx = collabs.findIndex(c => c.id === id);
                collabs[idx] = { ...collabs[idx], ...payload };
            } else {
                collabs.unshift({ id: Date.now().toString(), ...payload });
            }
            localStorage.setItem('mockCollabs', JSON.stringify(collabs));
            renderTable();
            closeModal();
            return;
        }

        if (id) {
            const { error } = await supabaseClient.from('collaborations').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from('collaborations').insert(payload);
            if (error) throw error;
        }

        closeModal();
        fetchCollabs();
    } catch (err) {
        console.error(err);
        alert('Error saving: ' + err.message);
    } finally {
        btn.innerText = 'Save Collaboration';
        btn.disabled = false;
    }
});
