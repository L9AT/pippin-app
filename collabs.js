document.addEventListener('DOMContentLoaded', async () => {
    const gridContainer = document.getElementById('collabGridContainer');
    const featuredContainer = document.getElementById('featuredCollabContainer');
    const emptyState = document.getElementById('emptyCollabsState');

    // Clear featured container as we will display all in a grid layout
    if (featuredContainer) {
        featuredContainer.innerHTML = '';
    }

    async function loadCollabs() {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }

        // Fetch only rows where is_live = true
        const { data, error } = await supabaseClient
            .from('collaborations')
            .select('*')
            .eq('is_live', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            renderCollabs([]);
        } else {
            renderCollabs(data || []);
        }
    }

    function renderCollabs(collabs) {
        gridContainer.innerHTML = '';

        if (collabs.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        collabs.forEach(item => {
            const bannerStyle = item.banner_url
                ? `style="background-image: url('${item.banner_url}'); background-size: cover; background-position: center;"`
                : '';

            // Render each item as a clickable card
            gridContainer.innerHTML += `
                <a href="/collaborations/${item.slug}" class="collab-card collab-item" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; cursor: pointer;">
                    <div class="card-banner banner-pink" ${bannerStyle}>
                        <div class="status-badge live-badge"><span class="pulse-dot"></span> LIVE</div>
                    </div>
                    <div class="card-body">
                        <div class="card-brand" style="margin-bottom: 1.5rem;">
                            <h3 style="margin: 0; font-size: 1.4rem;">${item.name}</h3>
                        </div>
                        <div class="card-stats-grid">
                            <div class="card-stat">
                                <span class="c-label">Chain</span>
                                <span class="c-val">${item.chain || '—'}</span>
                            </div>
                            <div class="card-stat">
                                <span class="c-label">Supply</span>
                                <span class="c-val">${item.supply || '—'}</span>
                            </div>
                            <div class="card-stat">
                                <span class="c-label">Spots</span>
                                <span class="c-val spots-val">${item.spots || '0'}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        });
    }

    // Initial Load
    loadCollabs();

    // Make system reactive and real-time
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient
            .channel('collabs-public')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborations' }, payload => {
                loadCollabs();
            })
            .subscribe();
    }
});
