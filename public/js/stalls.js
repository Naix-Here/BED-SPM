// public/js/stalls.js — Browse all stalls (public).
(async function () {
  const grid = document.getElementById('stallsGrid');
  const searchInput = document.getElementById('searchInput');
  const hawkerCentreFilter = document.getElementById('hawkerCentreFilter');
  const cuisineFilter = document.getElementById('cuisineFilter');
  const stallCount = document.getElementById('stallCount');

  if (!grid) return;

  let allStalls = [];
  let allCuisines = [];
  let allHawkerCentres = [];
  let stallCuisines = {}; // { stallId: [name1, name2, ...] }

  // ----- Helpers -----
  function gradeColor(grade) {
    switch (grade) {
      case 'A': return 'tag-success';
      case 'B': return 'tag-warning';
      case 'C': return 'tag-warning';
      case 'D': return 'tag-danger';
      default: return 'tag-info';
    }
  }

  function statusColor(status) {
    if (status === 'Active') return 'tag-success';
    if (status === 'Closed') return 'tag-warning';
    if (status === 'Suspended') return 'tag-danger';
    return 'tag-info';
  }

  function renderStalls(list) {
    if (!list.length) {
      grid.innerHTML = `
        <div class="quick-card" style="grid-column:1/-1;text-align:center;">
          <strong>No stalls match your filters.</strong>
          <span>Try clearing the search or picking a different hawker centre.</span>
        </div>
      `;
      stallCount.textContent = '0';
      return;
    }
    stallCount.textContent = list.length;
    grid.innerHTML = list.map((s) => {
      const cuisines = stallCuisines[s.StallId] || [];
      const cuisineBadges = cuisines
        .slice(0, 3)
        .map((c) => `<span class="cuisine-tag" style="margin-right:4px;display:inline-block;">${escapeHtml(c)}</span>`)
        .join('');
      const grade = s.CurrentHygieneGrade;
      const gradeBadge = grade
        ? `<span class="tag ${gradeColor(grade)}" title="Current NEA hygiene grade">Grade ${escapeHtml(grade)}</span>`
        : `<span class="tag tag-info">No grade</span>`;
      const statusBadge = `<span class="tag ${statusColor(s.Status)}">${escapeHtml(s.Status)}</span>`;
      const safeImageUrl = (typeof s.ImageUrl === 'string' && /^https?:\/\//i.test(s.ImageUrl)) ? s.ImageUrl : '';
      const imageHtml = safeImageUrl
        ? `<div class="stall-card-image" style="background-image:url('${escapeHtml(safeImageUrl)}');" role="img" aria-label="${escapeHtml(s.Name)}"></div>`
        : `<div class="stall-card-image stall-card-image--fallback" aria-hidden="true"></div>`;
      return `
        <a class="quick-card stall-card" href="/stall-detail.html?stallId=${s.StallId}" style="text-decoration:none;color:inherit;">
          ${imageHtml}
          <div class="stall-card-body">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <strong>${escapeHtml(s.Name)}</strong>
              ${statusBadge}
            </div>
            <span style="margin-bottom:8px;display:inline-block;">
              <i class="fa-solid fa-location-dot" style="color:var(--accent);"></i>
              &nbsp;${escapeHtml(s.HawkerCentreName || '')} &middot; ${escapeHtml(s.UnitNumber || '')}
            </span>
            <span style="display:block;margin-bottom:8px;color:var(--muted);">${escapeHtml(s.Description || 'A welcoming hawker stall.')}</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px;">
              ${cuisineBadges}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
              ${gradeBadge}
              <span class="text-link" style="font-size:.85rem;">View Menu &rarr;</span>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }

  function applyFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const hc = hawkerCentreFilter.value;
    const cuisine = cuisineFilter.value;

    let filtered = allStalls.slice();
    if (q) {
      filtered = filtered.filter((s) => (s.Name || '').toLowerCase().includes(q));
    }
    if (hc) {
      filtered = filtered.filter((s) => String(s.HawkerCentreId) === String(hc));
    }
    if (cuisine) {
      filtered = filtered.filter((s) => {
        const list = stallCuisines[s.StallId] || [];
        return list.includes(cuisine);
      });
    }
    renderStalls(filtered);
  }

  // ----- Data load -----
  try {
    const [stallsRes, cuisinesRes, hawkerRes] = await Promise.all([
      apiFetch('/stalls').catch((err) => {
        console.error('Failed to load stalls:', err);
        return { data: [] };
      }),
      apiFetch('/cuisines').catch(() => ({ data: [] })),
      apiFetch('/hawker-centres').catch(() => ({ data: [] })),
    ]);

    allStalls = stallsRes.data || stallsRes || [];
    allCuisines = cuisinesRes.data || cuisinesRes || [];
    allHawkerCentres = hawkerRes.data || hawkerRes || [];

    // Populate filters
    allHawkerCentres.forEach((hc) => {
      const opt = document.createElement('option');
      opt.value = hc.HawkerCentreId;
      opt.textContent = hc.Name;
      hawkerCentreFilter.appendChild(opt);
    });
    allCuisines.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.Name;
      opt.textContent = c.Name;
      cuisineFilter.appendChild(opt);
    });

    // Build cuisine list per stall (we need a menu-item-cuisines query, but the
    // public endpoint may not exist for cuisines joined to stalls. We'll fetch
    // each stall's menu and aggregate cuisine names from there.)
    const cuisineSet = new Set();
    await Promise.all(
      allStalls.map(async (s) => {
        try {
          const menuRes = await apiFetch(`/stalls/${s.StallId}/menu`).catch(() => null);
          const items = (menuRes && menuRes.data) || [];
          const names = new Set();
          items.forEach((it) => {
            if (it.CuisineNames) {
              String(it.CuisineNames)
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
                .forEach((n) => {
                  names.add(n);
                  cuisineSet.add(n);
                });
            }
          });
          stallCuisines[s.StallId] = Array.from(names);
        } catch (_) {
          stallCuisines[s.StallId] = [];
        }
      })
    );

    // If the cuisine set differs from the global cuisine list, add the extras as options
    if (cuisineSet.size > 0) {
      const known = new Set(allCuisines.map((c) => c.Name));
      Array.from(cuisineSet)
        .filter((n) => !known.has(n))
        .forEach((n) => {
          const opt = document.createElement('option');
          opt.value = n;
          opt.textContent = n;
          cuisineFilter.appendChild(opt);
        });
    }

    renderStalls(allStalls);
  } catch (err) {
    console.error('Stalls load error:', err);
    grid.innerHTML = `
      <div class="quick-card" style="grid-column:1/-1;text-align:center;">
        <strong>Unable to load stalls.</strong>
        <span>${escapeHtml(err.message || 'Please try again later.')}</span>
      </div>
    `;
  }

  // Wire filters
  searchInput.addEventListener('input', applyFilters);
  hawkerCentreFilter.addEventListener('change', applyFilters);
  cuisineFilter.addEventListener('change', applyFilters);
})();
