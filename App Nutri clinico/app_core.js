// --- EMERGENCY ERROR HANDLER & UNHANDLED REJECTIONS ---
window.onerror = function (msg, url, line, col, error) {
    alert("⚠️  Error de Script (V3.6): " + msg + "\nLínea: " + line);
    console.error(error);
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    console.error('⚠️ Unhandled Promise Rejection:', event.reason);
    const reason = event.reason;
    const msg = reason ? (reason.message || reason) : 'Error desconocido en Promesa';
    const stack = reason ? (reason.stack || '') : '';
    alert("⚠️  Error de Promesa (V4.52):\n" + msg + "\n\n" + stack);
});

// --- 1. DATE UTILITIES & AUTO-MASK FOR SPANISH FORMAT ---
window.parseSpanishDate = function(val) {
    if (!val) return null;
    let parts;
    if (val.includes('/')) {
        parts = val.split('/');
        if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                const birth = new Date(y, m - 1, d);
                birth.setHours(0,0,0,0);
                return birth;
            }
        }
    } else if (val.includes('-')) {
        parts = val.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                const birth = new Date(y, m - 1, d);
                birth.setHours(0,0,0,0);
                return birth;
            }
        }
    }
    return null;
};

window.formatDateInput = function(input) {
    let val = input.value;
    let cursor = input.selectionStart;
    
    // We only allow digits and slashes
    let cleanVal = val.replace(/[^0-9/]/g, '');
    
    // Split into parts by '/'
    let parts = cleanVal.split('/');
    
    // If there are more than 3 parts, merge the extra ones
    if (parts.length > 3) {
        parts = [parts[0], parts[1], parts.slice(2).join('')];
    }
    
    // Clean and limit each part
    if (parts[0] !== undefined) {
        let d = parts[0].replace(/\D/g, '').substring(0, 2);
        if (d.length === 2) {
            let dVal = parseInt(d, 10);
            if (dVal > 31) d = '31';
            else if (dVal === 0) d = '01';
        }
        parts[0] = d;
    }
    
    if (parts[1] !== undefined) {
        let m = parts[1].replace(/\D/g, '').substring(0, 2);
        if (m.length === 2) {
            let mVal = parseInt(m, 10);
            if (mVal > 12) m = '12';
            else if (mVal === 0) m = '01';
        }
        parts[1] = m;
    }
    
    if (parts[2] !== undefined) {
        let y = parts[2].replace(/\D/g, '').substring(0, 4);
        parts[2] = y;
    }
    
    // Auto-advance/insert slashes as they type forward!
    if (!input._lastVal) input._lastVal = "";
    let isDeleting = val.length < input._lastVal.length;
    
    if (!isDeleting) {
        if (parts[0] && parts[0].length === 2 && parts.length === 1) {
            parts.push('');
        }
        if (parts[1] && parts[1].length === 2 && parts.length === 2) {
            parts.push('');
        }
    }
    
    // Reconstruct newVal
    let newVal = parts.join('/');
    
    if (newVal.length > 10) {
        newVal = newVal.substring(0, 10);
    }
    
    input.value = newVal;
    input._lastVal = newVal;
    
    // Restore cursor position
    if (newVal.length > val.length && newVal.charAt(cursor) === '/') {
        cursor++;
    }
    input.setSelectionRange(cursor, cursor);
};

// --- SEDILE HRA V2.5 AUTH FIX - Build 20260128-1748 ---
// --- 1. SUPABASE CONFIGURATION ---
const supabaseUrl = 'https://qibkmvtbgauobedtjapg.supabase.co';
const supabaseKey = 'sb_publishable_xCxGjcAngmfd0hJYv2uphg_yB-pF3Hp';
const supabaseClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

// --- 2. DATABASE (Vademécum HRA & RTH) ---
const LOCAL_FORMULAS = [
    // --- FÓRMULAS EN POLVO ---
    { cat: "Fórmulas en Polvo", id: "similac_neosure", name: "Similac Neosure", type: "p", k: 513, p: 13.3, c: 52.8, f: 28.2, lipids_profile: { dha: 40, ara: 0 }, minerals: { na: 169, k: 708, cl: 384, ca: 539, p: 318, mg: 46, mn: 0.051, se: 0.0107, fe: 9.2, i: 0.077, cu: 0.616, zn: 6.1, cr: 0, mo: 0 } },
    { cat: "Fórmulas en Polvo", id: "lipidgen", name: "Lipidgen", type: "p", k: 436, p: 13, c: 67, f: 13, lipids_profile: { dha: 66, ara: 66 }, minerals: { na: 213, k: 428, cl: 339, ca: 353, p: 294, mg: 43, mn: 0.42, se: 0.013, fe: 7.4, i: 0.080, cu: 0.263, zn: 2.2, cr: 0.011, mo: 0.011 } },
    { cat: "Fórmulas en Polvo", id: "nan_comfort", name: "NAN ExpertPro Comfort", type: "p", k: 511, p: 9.8, c: 59.1, f: 26.1, lipids_profile: { dha: 48, ara: 48, cholesterol: 35 }, minerals: { na: 190, k: 520, cl: 610, ca: 330, p: 180, mg: 50, mn: 0.09, se: 0.009, fe: 4.9, i: 0.065, cu: 0.40, zn: 4.8 } },
    { cat: "Fórmulas en Polvo", id: "nan_1", name: "NAN 1", type: "p", k: 519, p: 9.6, c: 57.3, f: 27.7, lipids_profile: { dha: 60, ara: 60, cholesterol: 22 }, minerals: { na: 240, k: 520, cl: 300, ca: 300, p: 180, mg: 56, mn: 0.09, se: 0.018, fe: 5.9, i: 0.105, cu: 0.45, zn: 3.3 } },
    { cat: "Fórmulas en Polvo", id: "nido_1", name: "Nido +1", type: "p", k: 469, p: 12.0, c: 56.2, f: 20.0, lipids_profile: { dha: 0, ara: 0, cholesterol: 25 }, minerals: { na: 160, k: 540, cl: 0, ca: 650, p: 250, mg: 50, mn: 0, se: 0.012, fe: 6.8, i: 0, cu: 0, zn: 4.5 } },
    { cat: "Fórmulas en Polvo", id: "alfamino", name: "Alfamino", type: "p", k: 496, p: 13.3, c: 55.41, f: 24.6, lipids_profile: { dha: 70, ara: 70, cholesterol: 1 }, minerals: { na: 210, k: 550, cl: 405, ca: 540, p: 360, mg: 50, mn: 0.0725, se: 0.0092, fe: 5.0, i: 0.0825, cu: 0.40, zn: 5.0 } },
    { cat: "Fórmulas en Polvo", id: "althera", name: "Althera", type: "p", k: 504, p: 11.0, c: 56.0, f: 26.0, lipids_profile: { dha: 135, ara: 135, cholesterol: 0 }, minerals: { na: 195, k: 580, cl: 400, ca: 530, p: 350, mg: 45, mn: 0, se: 0.025, fe: 6.1, i: 0.122, cu: 0.41, zn: 4.3 } },
    { cat: "Fórmulas en Polvo", id: "similac_total_comfort", name: "Similac Total Comfort", type: "p", k: 510, p: 11.7, c: 53.0, f: 27.5, lipids_profile: { dha: 53, ara: 105, cholesterol: 0 }, minerals: { na: 226, k: 737, cl: 406, ca: 534, p: 384, mg: 38.4, mn: 0.098, se: 0.0181, fe: 6.3, i: 0.0993, cu: 0.38, zn: 4.1 } },
    { cat: "Fórmulas en Polvo", id: "neocate", name: "Neocate", type: "p", k: 483, p: 14.0, c: 52.0, f: 25.0, lipids_profile: { dha: 69, ara: 69, cholesterol: 0 }, minerals: { na: 189, k: 525, cl: 386, ca: 561, p: 397, mg: 51, mn: 0.20, se: 0.015, fe: 7.3, i: 0.10, cu: 0.41, zn: 5.3 } },
    { cat: "Fórmulas en Polvo", id: "nutrilon_pepti_junior", name: "Nutrilon Pepti Junior", type: "p", k: 515, p: 14.0, c: 53.0, f: 27.0, lipids_profile: { dha: 52, ara: 0, cholesterol: 0 }, minerals: { na: 140, k: 507, cl: 310, ca: 390, p: 218, mg: 40, mn: 0.244, se: 0.014, fe: 6.0, i: 0.093, cu: 0.314, zn: 3.9 } },
    { cat: "Fórmulas en Polvo", id: "pediasure_polvo", name: "Pediasure (Polvo)", type: "p", k: 464, p: 13.9, c: 60.7, f: 18.1, lipids_profile: { dha: 21, ara: 0, cholesterol: 0 }, minerals: { na: 176, k: 606, cl: 469, ca: 463, p: 388, mg: 91.7, mn: 0.69, se: 0.0148, fe: 6.5, i: 0.0449, cu: 0.30, zn: 3.1 } },
    { cat: "Fórmulas en Polvo", id: "lactantes_consultorio", name: "Fórmula Lactantes (Consultorio)", type: "p", k: 495, p: 13.0, c: 57.7, f: 23.6, lipids_profile: { dha: 0, ara: 0, cholesterol: 0 }, minerals: { na: 200, k: 550, cl: 270, ca: 350, p: 185, mg: 50, mn: 0.10, se: 0.01, fe: 5.4, i: 0.09, cu: 0.30, zn: 3.1 } },
    { cat: "Fórmulas en Polvo", id: "monogen", name: "Monogen", type: "p", k: 441, p: 12.8, c: 68.6, f: 12.9, lipids_profile: { dha: 0.06, ara: 0, cholesterol: 0 }, minerals: { na: 210, k: 397, cl: 301, ca: 365, p: 220, mg: 44, mn: 0.031, se: 0.0172, fe: 6.63, i: 0.0885, cu: 0.36, zn: 4.56 } },
    { cat: "Fórmulas en Polvo", id: "prenan", name: "Prenan", type: "p", k: 507, p: 12.5, c: 54.5, f: 26.6, lipids_profile: { dha: 90, ara: 90, cholesterol: 0 }, minerals: { na: 250, k: 570, cl: 335, ca: 558, p: 320, mg: 59, mn: 0.085, se: 0.015, fe: 5.1, i: 0.11, cu: 0.39, zn: 5.7 } },
    { cat: "Fórmulas en Polvo", id: "nan_sin_lactosa", name: "NAN Sin Lactosa", type: "p", k: 506, p: 10.4, c: 58.5, f: 25.6, lipids_profile: { dha: 42, ara: 42, cholesterol: 30 }, minerals: { na: 160, k: 480, cl: 340, ca: 280, p: 160, mg: 43, mn: 0.07, se: 0.009, fe: 5.0, i: 0.062, cu: 0.34, zn: 2.8 } },
    { cat: "Fórmulas en Polvo", id: "fortificador_leche_materna", name: "Fortificador Leche Materna", type: "p", k: 435, p: 35.5, c: 32.4, f: 4.2, lipids_profile: { dha: 157, ara: 0, cholesterol: 0 }, minerals: { na: 918, k: 1210, cl: 803, ca: 1890, p: 1095, mg: 100, mn: 0.185, se: 0.085, fe: 45.0, i: 0.39, cu: 1.3, zn: 23.5 } },
    
    // --- FÓRMULAS EN POLVO (LECHES HRA) ---
    { cat: "Leches HRA", id: "lacsure", name: "Lacsure", type: "p", stdDil: 25, allowedDilutions: [25, 28], k: 378, p: 14.7, c: 68.8, f: 3.24, lipids_profile: { dha: 0, ara: 0 }, minerals: { na: 146, k: 1377, cl: 0, ca: 478, p: 221, mg: 128, mn: 1.28, se: 0.015, fe: 3.3, i: 0.0595, cu: 0.25, zn: 3.5, cr: 0.0213, mo: 0 }, fibra: 3.4, hmb: 785 },
    { cat: "Leches HRA", id: "vivalite_gold", name: "Vivalite Gold", type: "p", stdDil: 22, allowedDilutions: [22], k: 409, p: 21.8, c: 47.7, f: 14.2, lipids_profile: { dha: 0, ara: 0 }, minerals: { na: 247, k: 646, cl: 291, ca: 641, p: 187, mg: 89.3, mn: 1.36, se: 0.0215, fe: 1.68, i: 0.0625, cu: 0.213, zn: 4.6, cr: 0.0239, mo: 0.0411 }, fibra: 2.67, hmb: 0 },
    { cat: "Leches HRA", id: "nat100_diabetico", name: "Nat100 Diabético", type: "p", stdDil: 22, allowedDilutions: [22, 25], k: 486.0, p: 20.5, c: 39.2, f: 27.5, lipids_profile: { dha: 0, ara: 0, omega3: 820 }, minerals: { na: 300, k: 600, cl: 450, ca: 360, p: 295, mg: 100, fe: 6.3, zn: 6.3, mn: 1.2, cu: 0.68, i: 0.07, se: 0.03, cr: 0.03, mo: 0.045 }, fibra: 6.8, hmb: 0 },
    { cat: "Leches HRA", id: "vivalite_up", name: "Vivalite Up", type: "p", stdDil: 22, allowedDilutions: [22], k: 379, p: 16.5, c: 53.9, f: 10.3, lipids_profile: { dha: 0, ara: 0 }, minerals: { na: 201, k: 1163, cl: 218, ca: 674, p: 303, mg: 84.3, mn: 1.46, se: 0.0225, fe: 2.22, i: 0.0657, cu: 0.258, zn: 4.8, cr: 0.0286, mo: 0.0431 }, fibra: 1.86, hmb: 2300 },
    { cat: "Leches HRA", id: "nat100_triple_fibra", name: "Nat100 Triple Fibra", type: "p", stdDil: 22, allowedDilutions: [22], k: 435, p: 15.4, c: 55.0, f: 17.1, lipids_profile: { dha: 0, ara: 0 }, minerals: { na: 300, k: 600, cl: 450, ca: 360, p: 295, mg: 100, mn: 1.2, se: 0.032, fe: 6.3, i: 0.07, cu: 0.68, zn: 6.3, cr: 0.032, mo: 0.045 }, fibra: 6.5, hmb: 0 },
    { cat: "Leches HRA", id: "nutren_senior", name: "Nutren Senior", type: "p", stdDil: 19, allowedDilutions: [19], k: 392, p: 31.3, c: 40.0, f: 11.0, lipids_profile: { dha: 0, ara: 0, cholesterol: 75 }, minerals: { na: 345, k: 0, cl: 0, ca: 1000, p: 490, mg: 287, mn: 1.229, se: 0.109, fe: 8.4, i: 0, cu: 0.675, zn: 16.0 }, fibra: 4.1, hmb: 0 },

    // --- FÓRMULAS LÍQUIDAS / ESPECIALES ---
    { cat: "Leches HRA", id: "alprem_liquido", name: "Alprem (100ml)", type: "l", k: 142.9, p: 5.1, c: 14.6, f: 7.1, lipids_profile: { dha: 26, ara: 26, cholesterol: 0 }, minerals: { na: 91.4, k: 212.9, cl: 135.4, ca: 207.1, p: 137.3, mg: 14.9, mn: 0.0223, se: 0.0086, fe: 3.29, i: 0.0501, cu: 0.1429, zn: 2.14 } },

    // --- RECETAS (LECHES HRA) ---
    { cat: "Leches HRA", id: "e1", name: "E1", type: "l", stdDil: 22, k: 94.2, p: 3.5, c: 12.6, f: 3.1, minerals: {} },
    {
        cat: "Leches HRA", id: "e2", name: "E2", type: "recipe", recipe: [
            { id: "comp_ensure", name: "Ensure", defPct: 22, k: 428.18, p: 15.9, c: 57.27, f: 14.09 },
            { id: "comp_proteinex", name: "Proteinex", defPct: 3, k: 357.0, p: 90.0, c: 0.0, f: 0.0 }
        ], minerals: {}
    },
    {
        cat: "Leches HRA", id: "e3", name: "E3", type: "recipe", recipe: [
            { id: "comp_ensure", name: "Ensure", defPct: 22, k: 428.18, p: 15.9, c: 57.27, f: 14.09 },
            { id: "comp_proteinex", name: "Proteinex", defPct: 3, k: 357.0, p: 90.0, c: 0.0, f: 0.0 },
            { id: "comp_nessucar", name: "Nessucar", defPct: 5, k: 380.0, p: 0.0, c: 96.0, f: 0.0 }
        ], minerals: {}
    },
    {
        cat: "Leches HRA", id: "e4", name: "E4 (Espesado)", type: "recipe", recipe: [
            { id: "comp_ensure", name: "Ensure", defPct: 22, k: 428.18, p: 15.9, c: 57.27, f: 14.09 },
            { id: "comp_proteinex", name: "Proteinex", defPct: 3, k: 357.0, p: 90.0, c: 0.0, f: 0.0 },
            { id: "comp_nessucar", name: "Nessucar", defPct: 5, k: 380.0, p: 0.0, c: 96.0, f: 0.0 }
        ], minerals: {}
    },
    { cat: "Leches HRA", id: "g1", name: "G1", type: "l", stdDil: 20, k: 95.3, p: 4.3, c: 9.1, f: 3.5, minerals: {} },
    {
        cat: "Leches HRA", id: "g2", name: "G2", type: "recipe", recipe: [
            { id: "comp_vivalitegold", name: "Vivalite Gold", defPct: 20, k: 476.5, p: 21.5, c: 45.5, f: 17.5 },
            { id: "comp_proteinex", name: "Proteinex", defPct: 3, k: 357.0, p: 90.0, c: 0.0, f: 0.0 }
        ], minerals: {}
    },
    {
        cat: "Leches HRA", id: "g3", name: "G3", type: "recipe", recipe: [
            { id: "comp_vivalitegold", name: "Vivalite Gold", defPct: 20, k: 476.5, p: 21.5, c: 45.5, f: 17.5 },
            { id: "comp_proteinex", name: "Proteinex", defPct: 3, k: 357.0, p: 90.0, c: 0.0, f: 0.0 },
            { id: "comp_nessucar", name: "Nessucar", defPct: 5, k: 380.0, p: 0.0, c: 96.0, f: 0.0 }
        ], minerals: {}
    },
    {
        cat: "Leches HRA", id: "g4", name: "G4 (Espesado)", type: "recipe", recipe: [
            { id: "comp_vivalitegold", name: "Vivalite Gold", defPct: 20, k: 476.5, p: 21.5, c: 45.5, f: 17.5 },
            { id: "comp_proteinex", name: "Proteinex", defPct: 3, k: 357.0, p: 90.0, c: 0.0, f: 0.0 },
            { id: "comp_nessucar", name: "Nessucar", defPct: 5, k: 380.0, p: 0.0, c: 96.0, f: 0.0 }
        ], minerals: {}
    },

    // --- FÓRMULAS RTH (ADULTO ENTERAL) ---
    { cat: "Fórmulas RTH", id: "osmolite", name: "Osmolite", type: "l", volBase: 500, k: 100.0, p: 4.0, c: 13.6, f: 3.4, minerals: { na: 93, k: 157, cl: 142, ca: 70, p: 70, mg: 21, fe: 1.5, zn: 1.4, cu: 0.18, mn: 0.3, i: 0.012, se: 0.007, cr: 0.009, mo: 0.014 } },
    { cat: "Fórmulas RTH", id: "glucerna_15", name: "Glucerna 1.5", type: "l", volBase: 1000, k: 150.0, p: 7.5, c: 12.76, f: 7.5, minerals: { na: 140, k: 165, cl: 145, ca: 100, p: 100, mg: 31, fe: 0.85, zn: 1.4, cu: 0.15, mn: 0.25 } },
    { cat: "Fórmulas RTH", id: "diben_15", name: "Diben 1.5 (1000 ml)", type: "l", volBase: 1000, k: 150.0, p: 7.5, c: 13.1, f: 7.0, minerals: { na: 85, k: 155, cl: 110, ca: 80, p: 63, mg: 30, fe: 2.0, zn: 1.8, cu: 0.2, mn: 0.4, i: 0.02, se: 0.01, cr: 0.02, mo: 0.015 } },
    { cat: "Fórmulas RTH", id: "jevity_1", name: "Jevity 1.0 (1000ml)", type: "l", volBase: 1000, k: 106.0, p: 4.4, c: 15.1, f: 3.4, minerals: { na: 100, k: 168, cl: 150, ca: 80, p: 80, mg: 25, fe: 1.8, zn: 1.4 } },
    { cat: "Fórmulas RTH", id: "fresubin_fibre", name: "Fresubin Original Fibre", type: "l", volBase: 500, k: 100.0, p: 3.8, c: 13.0, f: 3.4, minerals: { na: 75, k: 125, cl: 115, ca: 80, p: 63, mg: 25, fe: 1.3, zn: 1.2 } },
    { cat: "Fórmulas RTH", id: "fresubin_intensive", name: "Fresubin Intensive", type: "l", volBase: 500, k: 122.0, p: 10.0, c: 12.9, f: 3.2, minerals: { na: 100, k: 180, cl: 120, ca: 90, p: 85, mg: 28, fe: 1.5, zn: 1.5 } },
    { cat: "Fórmulas RTH", id: "fresubin_2kcal", name: "Fresubin 2 Kcal HP", type: "l", volBase: 500, k: 200.0, p: 10.0, c: 17.5, f: 10.0, minerals: { na: 120, k: 230, cl: 150, ca: 160, p: 130, mg: 40, fe: 2.5, zn: 2.2 } },
    { cat: "Fórmulas RTH", id: "ensure_clinical_rth", name: "Ensure Clinical (RTH)", type: "l", volBase: 500, k: 149.2, p: 8.0, c: 18.0, f: 4.8, minerals: { na: 110, k: 235, cl: 80, ca: 125, p: 100, mg: 27, fe: 2.0, zn: 1.8 } },

    // --- BOTELLINES ---
    { cat: "Botellines", id: "ensure_clinical_bot", name: "Ensure Clinical", type: "l", isBotellin: true, volUnit: 220, k: 149.2, p: 8.0, c: 18.0, f: 4.8, minerals: {} },
    { cat: "Botellines", id: "glucerna_shake", name: "Glucerna Shake", type: "l", isBotellin: true, volUnit: 237, k: 93.0, p: 4.6, c: 11.0, f: 3.4, minerals: {} },
    { cat: "Botellines", id: "supportan_drink", name: "Supportan Drink", type: "l", isBotellin: true, volUnit: 200, k: 150.0, p: 10.0, c: 12.4, f: 6.7, minerals: {} },
    { cat: "Botellines", id: "ensure_compact", name: "Ensure Compact", type: "l", isBotellin: true, volUnit: 125, k: 240.0, p: 10.2, c: 28.7, f: 9.4, minerals: {} },
    { cat: "Botellines", id: "pediasure_drink", name: "Pediasure Drink", type: "l", isBotellin: true, volUnit: 200, k: 100.0, p: 3.0, c: 13.1, f: 3.9, minerals: {} },
    { cat: "Botellines", id: "fresubin_renal", name: "Fresubin Renal", type: "l", isBotellin: true, volUnit: 200, k: 200.0, p: 3.0, c: 26.4, f: 8.9, minerals: { na: 68, k: 100, cl: 62, ca: 84, p: 55, mg: 20, fe: 2.0, zn: 1.8, cu: 0.20, mn: 0.4, i: 0.02, se: 0.01, cr: 0.003, mo: 0.007 } },
    { cat: "Botellines", id: "fresubin_hepa", name: "Fresubin Hepa Drink", type: "l", isBotellin: true, volUnit: 200, k: 130.0, p: 4.0, c: 17.4, f: 4.7, minerals: { na: 75, k: 120, cl: 71.5, ca: 80, p: 53, mg: 27, fe: 1.33, zn: 1.2, cu: 0.13, mn: 0.27, i: 0.0133, se: 0.00667, cr: 0.00667, mo: 0.01 } },
    { cat: "Botellines", id: "fresubin_2kcal_drink", name: "Fresubin 2.0 kcal Drink", type: "l", isBotellin: true, volUnit: 200, k: 200.0, p: 10.0, c: 22.5, f: 7.8, minerals: { na: 60, k: 160, cl: 80, ca: 205, p: 120, mg: 16, fe: 2.5, zn: 1.6, cu: 0.38, mn: 0.5, i: 0.0375, se: 0.0135, cr: 0.0125, mo: 0.0188 } },
    { cat: "Botellines", id: "nepro_dialysis", name: "Nepro (Diálisis)", type: "l", isBotellin: true, volUnit: 220, k: 180.0, p: 8.1, c: 14.7, f: 9.6, minerals: { na: 106, k: 106, cl: 84, ca: 106, p: 72, mg: 21, fe: 1.9, zn: 2.7, cu: 0.21, mn: 0.21, i: 0.016, se: 0.0074, cr: 0.0125, mo: 0.0079 } }
];

// --- 3. GLOBAL STATE ---
const AppState = {
    user: null,
    patient: { id: null, nombre: '', edad: 0, sexo: 'm', peso: 0, estatura: 0, actividad: 1.2, bmi: 0, tmt: 0, ia_report: null },
    formulas: LOCAL_FORMULAS,
    
    favorites: [], // Init empty first
    userOverridesGoal: false,
    compareMode: false,
    adequacyMode: 'goal', // 'goal' or 'get'
    traslape: {
        active: false,
        sourceKcal: 0,
        sourceProt: 0,
        sourceVol: 0,
        pct: 100 // % Enteral
    },
    uun: 4, // Urea Nitrogen in Urine (default factor)
    formulaB: null,
    chart: null
};

// --- DATA STRUCTURES (V3.50/V3.61) ---
const MODULE_DATA = {
    nessucar: { kcal: 380, p: 0, c: 96, f: 0 },
    mct: { kcal: 855, p: 0, c: 0, f: 95 },
    enterex: { kcal: 383, p: 0, c: 95, f: 0 },
    banatrol: { kcal: 372, p: 0, c: 65.11, f: 0 },
    proteinex: { kcal: 357, p: 90, c: 0, f: 0 },
    fresubin: { kcal: 360, p: 87, c: 0, f: 0 }
};

const DRUG_INTERACTIONS = {
    "fenitoina": "⚠️ Separar de la nutrición enteral (NE) al menos 1-2 horas antes y después para evitar reducción en su absorción. Monitorizar niveles séricos.",
    "propofol": "⚠️ Aporta 1.1 kcal/ml de lípidos. Considerar este aporte calórico graso dentro del balance calórico total para evitar sobrealimentación.",
    "omeprazol": "⚠️ Administrar preferentemente en ayunas o 30-60 min antes de la NE para asegurar eficacia. No mezclar directamente con la fórmula.",
    "furosemida": "⚠️ Puede causar hipopotasemia e hipomagnesemia. Monitorizar electrolitos periódicamente si se usa con NE a largo plazo.",
    "levodopa": "⚠️ Las proteínas de la dieta pueden competir con su absorción. Ajustar tiempos de toma si el control motor fluctúa.",
    "warfarina": "⚠️ El contenido de Vitamina K de algunas fórmulas enterales puede interferir con el efecto anticoagulante. Mantener aporte constante.",
    "metformina": "⚠️ Puede causar déficit de B12 con uso prolongado. Considerar suplementación si existen signos clínicos.",
    "cloroquina": "⚠️ Puede causar hipoglicemia severa. Monitorizar glicemia capilar.",
    "ciprofloxacino": "⚠️ La absorción se reduce significativamente con productos lácteos o fórmulas enterales cálcicas. Suspender NE 2h antes/después."
};

// Safely load favorites
try {
    const stored = localStorage.getItem('sedile_favs');
    if (stored) AppState.favorites = JSON.parse(stored);
} catch (e) {
    console.error("Error loading favorites", e);
    AppState.favorites = [];
}

// --- 4. INITIALIZATION & AUTH ---
let macroGoalMode = 'gkg'; // Global macro mode initialized
let goalChartInstance = null; // Global chart instance

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 SEDILE HRA: DOMContentLoaded initialized");

    // --- AUTH REFACTOR V4.30 (Centralized) ---
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("🔑 Auth Event:", event);
        if (session) {
            AppState.user = session.user;
            // Defer execution using setTimeout to break the call stack and avoid Supabase auth lock deadlock
            setTimeout(() => showApp(), 0);
        } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
            setTimeout(async () => {
                const { data } = await supabaseClient.auth.getSession();
                if (data.session) {
                    AppState.user = data.session.user;
                    showApp();
                } else {
                    showLogin();
                }
            }, 0);
        }
    });

    const btnLogin = document.getElementById('btnLoginGoogle');
    if (btnLogin) btnLogin.onclick = login;

    const btnLogoutHeader = document.getElementById('btnLogoutHeader');
    if (btnLogoutHeader) btnLogoutHeader.onclick = logout;

    const safelyInit = (fn, name) => {
        try { fn(); } catch (e) { console.error(`❌ Init Error (${name}):`, e); }
    };

    safelyInit(initCompactLayout, "CompactLayout");
    safelyInit(initTabNavigation, "TabNavigation");
    safelyInit(initProtocolModal, "ProtocolModal");
    safelyInit(initHistoryModal, "HistoryModal");
    safelyInit(initPatientLogic, "PatientLogic");
    safelyInit(initSimulatorLogic, "SimulatorLogic");
    safelyInit(initInfusionLogic, "InfusionLogic");
    safelyInit(initHydrationLogic, "HydrationLogic");
    safelyInit(initCompareLogic, "CompareLogic");
    safelyInit(initChartSim, "ChartSim");
    safelyInit(initGoalMacroChart, "GoalMacroChart");
    safelyInit(initAssessmentLogic, "AssessmentLogic");
    safelyInit(initEvolutionLogic, "EvolutionLogic");
    safelyInit(initGlobalEvents, "GlobalEvents");
    safelyInit(initNutriIA, "NutriIA");
    safelyInit(initVoiceDictation, "VoiceDictation");
    safelyInit(initWardKanban, "WardKanban");
    safelyInit(initAdminPanel, "AdminPanel");
    safelyInit(updateFormulaSelect, "updateFormulaSelect");
    safelyInit(initFormulaSearch, "initFormulaSearch");
    safelyInit(applyCircularFavicon, "applyCircularFavicon");

    console.log("✅ Initialization complete. Formulas loaded:", AppState.formulas.length);

    // Force repopulating formulas after a delay
    setTimeout(() => {
        const sel = document.getElementById('formulaSelect');
        if (sel && sel.options.length <= 1) {
            console.warn("⚠️  Dropdown empty, retrying updateFormulaSelect...");
            safelyInit(updateFormulaSelect, "retryUpdateFormulaSelect");
        }
    }, 1560);
});

async function applyCircularFavicon() {
    const faviconUrl = 'logo.png';
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw circle clipping path
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw image centered
        ctx.drawImage(img, (size - img.width) / 2, (size - img.height) / 2);

        // Update favicon link
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = canvas.toDataURL("image/png");
    };
    img.src = faviconUrl;
}

async function checkUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        AppState.user = session.user;
        showApp();
    } else {
        showLogin();
    }
}

// Make login available globally
window.login = async function () {
    console.log("Intentando login...");

    if (window.location.protocol === 'file:') {
        alert("⚠️ Error: Estás abriendo el archivo localmente (file://). Debes usar Vercel.");
        return;
    }

    if (!supabaseClient) {
        alert("🔴 Error Crítico: Supabase no se cargó. Revisa tu conexión a internet.");
        return;
    }

    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    } catch (err) {
        alert("Error Supabase: " + err.message);
    }
};

window.logout = async function () {
    // 1. Mostrar login e iniciar limpieza de forma inmediata para respuesta visual instantánea
    if (typeof showLogin === 'function') showLogin();
    
    sessionStorage.clear();
    localStorage.clear();
    
    // 2. Ejecutar cierre de sesión en Supabase (no bloqueante)
    try {
        supabaseClient.auth.signOut();
    } catch (e) {
        console.error(e);
    }
    
    // 3. Limpiar service workers y cachés en segundo plano sin bloquear la navegación
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (const registration of registrations) {
                registration.unregister();
            }
        });
    }
    
    if ('caches' in window) {
        caches.keys().then(keys => {
            Promise.all(keys.map(key => caches.delete(key)));
        });
    }

    // 4. Redirigir de inmediato al origen limpio (hall de inicio)
    window.location.replace(window.location.origin);
}

async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function showApp(isManualCheck = false) {
    try {
        if (!AppState.user) {
            showLogin();
            return;
        }

        const authScreen = document.getElementById('auth-screen');
        const blockedScreen = document.getElementById('access-blocked-screen');
        const pinLock = document.getElementById('pin-lock-screen');
        const mainApp = document.getElementById('main-app');

        const userEmail = AppState.user?.email || '';
        const userName = AppState.user?.user_metadata?.full_name || AppState.user?.email || 'Colega';
        const isAdmin = userEmail === 'martingonza2010@gmail.com';

        // 1. Mostrar/Ocultar el botón de Administrador en el Header
        const btnAdminPanel = document.getElementById('btnAdminPanel');
        if (btnAdminPanel) {
            btnAdminPanel.style.display = isAdmin ? 'inline-flex' : 'none';
        }

        const isUnlocked = sessionStorage.getItem('sedile_unlocked') === 'true';

        // SI YA ESTÁ DESBLOQUEADO: Validar ubicación obligatoria
        if (isUnlocked) {
            const activeLoc = localStorage.getItem('activeLocation');
            if (!activeLoc) {
                if (authScreen) authScreen.style.display = 'none';
                if (blockedScreen) blockedScreen.style.display = 'none';
                if (pinLock) pinLock.style.display = 'none';
                if (mainApp) mainApp.style.display = 'none';
                window.openLocationSelector(false); // Forzar selección obligatoria
                return;
            } else {
                window.updateActiveLocationBadge();
            }

            if (authScreen) authScreen.style.display = 'none';
            if (blockedScreen) blockedScreen.style.display = 'none';
            if (pinLock) pinLock.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';

            if (AppState.user && AppState.user.user_metadata) {
                const name = AppState.user.user_metadata.full_name || AppState.user.email || 'Usuario';
                const displayEl = document.getElementById('userNameDisplay');
                if (displayEl) {
                    displayEl.innerHTML = `Nutricionista <b>${name}</b>`;
                }
            }

            // Si es administrador, ya terminamos, no requiere validación de Supabase adicional
            if (isAdmin) return;
        }

        // CONTROL DE ACCESO (ADMIN APPROVAL FLOW)
        const runAccessCheck = async () => {
            const btnCheckAuth = document.getElementById('btnCheckAuth');
            const feedbackEl = document.getElementById('blockedFeedbackMessage');

            if (isManualCheck) {
                // Mostrar estado visual de carga en el botón
                if (btnCheckAuth) {
                    btnCheckAuth.disabled = true;
                    btnCheckAuth.innerHTML = "⏳ Verificando autorización...";
                    btnCheckAuth.style.opacity = "0.7";
                    btnCheckAuth.style.cursor = "not-allowed";
                }

                // Ocultar feedback anterior
                if (feedbackEl) {
                    feedbackEl.style.display = 'none';
                }
            }

            const restoreButtonState = () => {
                if (btnCheckAuth) {
                    btnCheckAuth.disabled = false;
                    btnCheckAuth.innerHTML = "🔄 Comprobar Autorización";
                    btnCheckAuth.style.opacity = "1";
                    btnCheckAuth.style.cursor = "pointer";
                }
            };

            if (supabaseClient) {
                const { data: records, error: fetchError } = await supabaseClient
                    .from('acceso_usuarios')
                    .select('*')
                    .ilike('email', userEmail);

                if (fetchError) {
                    console.error("Error al consultar control de acceso:", fetchError);
                    // Si ya estaba desbloqueado, no interrumpimos la sesión del usuario por un error temporal de conexión
                    if (isUnlocked) return;

                    if (feedbackEl) {
                        feedbackEl.style.display = 'block';
                        feedbackEl.style.background = '#fde8e8';
                        feedbackEl.style.color = '#e74c3c';
                        feedbackEl.style.borderColor = '#f8b4b4';
                        feedbackEl.innerHTML = `❌ Error de red o base de datos: ${fetchError.message || 'Fallo de conexión'}`;
                    }
                    restoreButtonState();
                    showAccessBlockedScreen(userName, userEmail);
                    return;
                }

                // Priorizar el registro habilitado si hay duplicados por discrepancias de mayúsculas/minúsculas
                const record = (records && records.length > 0)
                    ? (records.find(r => r.acceso_permitido === true) || records[0])
                    : null;

                if (!record) {
                    // Auto-registrar como PENDIENTE
                    const { error: insertError } = await supabaseClient
                        .from('acceso_usuarios')
                        .insert([
                            {
                                email: userEmail,
                                nombre: userName,
                                user_id: AppState.user.id,
                                acceso_permitido: false
                            }
                        ]);

                    if (insertError) {
                        console.error("Error al auto-registrar usuario:", insertError);
                    }

                    if (isUnlocked) {
                        // Si estaba desbloqueado pero se eliminó de la BD, revocamos acceso
                        sessionStorage.removeItem('sedile_unlocked');
                    }

                    if (feedbackEl) {
                        feedbackEl.style.display = 'block';
                        feedbackEl.style.background = '#fef3c7';
                        feedbackEl.style.color = '#d97706';
                        feedbackEl.style.borderColor = '#fcd34d';
                        feedbackEl.innerHTML = `⏳ Solicitud de acceso enviada al Administrador. Por favor, espera su aprobación.`;
                    }
                    restoreButtonState();
                    showAccessBlockedScreen(userName, userEmail);
                    return;
                } else if (!record.acceso_permitido) {
                    if (isUnlocked) {
                        // Si estaba desbloqueado pero ahora fue denegado, revocamos el acceso de inmediato
                        sessionStorage.removeItem('sedile_unlocked');
                        window.location.reload();
                        return;
                    }

                    if (feedbackEl) {
                        feedbackEl.style.display = 'block';
                        feedbackEl.style.background = '#fef3c7';
                        feedbackEl.style.color = '#d97706';
                        feedbackEl.style.borderColor = '#fcd34d';
                        feedbackEl.innerHTML = `⏳ Acceso en espera de aprobación. Comunícate con el Administrador para que te habilite.`;
                    }
                    restoreButtonState();
                    showAccessBlockedScreen(userName, userEmail);
                    return;
                } else {
                    // ¡Habilitado con éxito!
                    if (feedbackEl) {
                        feedbackEl.style.display = 'block';
                        feedbackEl.style.background = '#d1fae5';
                        feedbackEl.style.color = '#065f46';
                        feedbackEl.style.borderColor = '#a7f3d0';
                        feedbackEl.innerHTML = `✅ ¡Acceso aprobado! Cargando pantalla de PIN...`;
                    }
                    restoreButtonState();
                    if (blockedScreen) blockedScreen.style.display = 'none';

                    // Si no está desbloqueado, ocultar las demás y mostrar la pantalla de PIN
                    if (!isUnlocked) {
                        if (authScreen) authScreen.style.display = 'none';
                        if (mainApp) mainApp.style.display = 'none';
                        showPINLockScreen();
                    }
                }
            } else {
                console.error("Supabase client is not loaded.");
                if (feedbackEl) {
                    feedbackEl.style.display = 'block';
                    feedbackEl.style.background = '#fde8e8';
                    feedbackEl.style.color = '#e74c3c';
                    feedbackEl.style.borderColor = '#f8b4b4';
                    feedbackEl.innerHTML = `❌ Error Crítico: No se pudo cargar el cliente de base de datos de Supabase. Revisa tu conexión a internet o intenta recargar la página.`;
                }
                restoreButtonState();
                showAccessBlockedScreen(userName, userEmail);
            }
        };

        if (isAdmin) {
            // El administrador siempre tiene acceso directo y no es bloqueado en BD
            if (blockedScreen) blockedScreen.style.display = 'none';
            if (!isUnlocked) {
                if (authScreen) authScreen.style.display = 'none';
                if (mainApp) mainApp.style.display = 'none';
                showPINLockScreen();
            }
        } else {
            // Colegas regulares:
            if (isUnlocked) {
                // Si ya está desbloqueado, hacemos la validación en segundo plano sin interrumpir al usuario
                runAccessCheck().catch(err => console.error("Error en validación en segundo plano:", err));
            } else {
                // Si no está desbloqueado, hacemos la verificación de forma bloqueante (con await)
                // Manteniendo la pantalla actual visible mientras se consulta, para evitar pantallas en blanco.
                await runAccessCheck();
            }
        }

    } catch (err) {
        console.error("🔴 Error displaying App:", err);
        alert("🔴 Error displaying App: " + err.message + "\n" + err.stack);
    }
}

window.showApp = showApp;

async function showPINLockScreen() {
    try {
        const lockScreen = document.getElementById('pin-lock-screen');
        if (!lockScreen) {
            console.error("Error: pin-lock-screen element not found");
            return;
        }
        lockScreen.style.display = 'flex';

        const pinInput = document.getElementById('pinInput');
        const pinConfirmInput = document.getElementById('pinConfirmInput');
        const pinConfirmGroup = document.getElementById('pinConfirmGroup');
        const title = document.getElementById('pinWelcomeTitle');
        const desc = document.getElementById('pinWelcomeDesc');
        const errEl = document.getElementById('pinErrorMessage');

        if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
        }
        if (pinConfirmInput) pinConfirmInput.value = '';
        if (errEl) errEl.style.display = 'none';

        const name = AppState.user?.user_metadata?.full_name || AppState.user?.email || 'Usuario';
        const pinHash = AppState.user?.user_metadata?.pin_hash;

        if (title) {
            title.innerText = !pinHash ? "🔒 Configura tu PIN" : "🔒 Bloqueo de Seguridad";
        }
        if (desc) {
            desc.innerText = !pinHash 
                ? `¡Bienvenido, ${name}! Define tu código secreto de 4 a 6 dígitos para proteger tus datos.`
                : `Hola, ${name}. Ingresa tu código de acceso para continuar.`;
        }
        if (pinConfirmGroup) {
            pinConfirmGroup.style.display = !pinHash ? 'block' : 'none';
        }
    } catch (e) {
        console.error("Error in showPINLockScreen:", e);
        alert("Error en pantalla de PIN: " + e.message + "\n" + e.stack);
    }
}

window.submitPIN = async function() {
    const pinInput = document.getElementById('pinInput');
    const pinConfirmInput = document.getElementById('pinConfirmInput');
    const errEl = document.getElementById('pinErrorMessage');
    
    if (errEl) errEl.style.display = 'none';

    const pinVal = pinInput ? pinInput.value.trim() : '';
    if (!/^[0-9]{4,6}$/.test(pinVal)) {
        showPINError("⚠️ El PIN debe ser numérico y tener entre 4 y 6 dígitos.");
        return;
    }

    const pinHashExist = AppState.user?.user_metadata?.pin_hash;
    
    if (!pinHashExist) {
        // Flujo de Configuración Inicial
        const confirmVal = pinConfirmInput ? pinConfirmInput.value.trim() : '';
        if (pinVal !== confirmVal) {
            showPINError("⚠️ Los códigos no coinciden. Inténtalo de nuevo.");
            return;
        }

        try {
            const hashed = await hashPIN(pinVal);
            
            // Inmunizar estableciendo el estado de desbloqueado de antemano (evita colisiones con onAuthStateChange concurrente)
            sessionStorage.setItem('sedile_unlocked', 'true');

            // Guardar en la metadata de Supabase Auth
            const { data, error } = await supabaseClient.auth.updateUser({
                data: { pin_hash: hashed }
            });

            if (error) {
                sessionStorage.removeItem('sedile_unlocked');
                throw error;
            }

            AppState.user = data.user;
            
            const lockScreen = document.getElementById('pin-lock-screen');
            if (lockScreen) lockScreen.style.display = 'none';
            await showApp();
            showToast("✅ PIN secreto configurado con éxito.");
        } catch (err) {
            showPINError("🔴 Error al guardar en Supabase: " + err.message);
        }
    } else {
        // Flujo de Validación Recurrente
        const hashedInput = await hashPIN(pinVal);
        if (hashedInput === pinHashExist) {
            sessionStorage.setItem('sedile_unlocked', 'true');
            const lockScreen = document.getElementById('pin-lock-screen');
            if (lockScreen) lockScreen.style.display = 'none';
            await showApp();
            showToast("🔓 Acceso concedido.");
        } else {
            showPINError("❌ Código secreto incorrecto. Inténtalo de nuevo.");
            if (pinInput) {
                pinInput.value = '';
                pinInput.focus();
            }
        }
    }
};

function showPINError(msg) {
    const errEl = document.getElementById('pinErrorMessage');
    if (errEl) {
        errEl.innerText = msg;
        errEl.style.display = 'block';
    }
}

function showLogin() {
    document.getElementById('auth-screen').style.display = 'grid';
    document.getElementById('main-app').style.display = 'none';
    const pinLock = document.getElementById('pin-lock-screen');
    if (pinLock) pinLock.style.display = 'none';
    const blockedScreen = document.getElementById('access-blocked-screen');
    if (blockedScreen) blockedScreen.style.display = 'none';
}

function showAccessBlockedScreen(name, email) {
    const mainApp = document.getElementById('main-app');
    const pinLock = document.getElementById('pin-lock-screen');
    const authScreen = document.getElementById('auth-screen');
    const blockedScreen = document.getElementById('access-blocked-screen');
    
    if (mainApp) mainApp.style.display = 'none';
    if (pinLock) pinLock.style.display = 'none';
    if (authScreen) authScreen.style.display = 'none';
    
    if (blockedScreen) {
        blockedScreen.style.display = 'grid';
        
        const nameEl = document.getElementById('blockedUserName');
        const emailEl = document.getElementById('blockedUserEmail');
        if (nameEl) nameEl.innerText = name;
        if (emailEl) emailEl.innerText = email;
    }
}

// Escucha para enviar el PIN con la tecla Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const lockScreen = document.getElementById('pin-lock-screen');
        if (lockScreen && lockScreen.style.display === 'flex') {
            window.submitPIN();
        }
    }
});

// --- 5. COMPACT UI LOGIC ---

// --- 6. MODALS ---
function initProtocolModal() {
    const modal = document.getElementById('protocolModal');
    const btnOpenFab = document.getElementById('btnProtocolOpen');
    const btnOpenPurpose = document.getElementById('btnOpenPurpose');
    const btnClose = document.getElementById('btnProtocolClose');
    
    if (btnOpenFab && modal) btnOpenFab.onclick = () => modal.classList.add('active');
    
    if (btnOpenPurpose && modal) {
        btnOpenPurpose.onclick = (e) => {
            e.preventDefault();
            modal.classList.add('active');
        };
    }
    
    if (btnClose && modal) btnClose.onclick = () => modal.classList.remove('active');
}

// Global scope to ensure it's available early
window.switchProtocolTab = (idx) => {
    console.log("🔄 switchProtocolTab called with index:", idx);
    const btnRTH = document.getElementById('btnTabRTH');
    const btnDeliv = document.getElementById('btnTabDelivery');
    const tabInf = document.getElementById('tab-infusion');
    const tabDel = document.getElementById('tab-delivery');

    if (idx === 0) {
        if (btnRTH) btnRTH.classList.add('active');
        if (btnDeliv) btnDeliv.classList.remove('active');
        if (tabInf) tabInf.style.display = 'block';
        if (tabDel) tabDel.style.display = 'none';
    } else {
        if (btnRTH) btnRTH.classList.remove('active');
        if (btnDeliv) btnDeliv.classList.add('active');
        if (tabInf) tabInf.style.display = 'none';
        if (tabDel) tabDel.style.display = 'block';
    }
};

function initHistoryModal() {
    const modal = document.getElementById('historyModal');
    const btnOpen = document.getElementById('btnOpenHistory');
    const btnClose = document.getElementById('btnHistoryClose');
    if (btnOpen) btnOpen.onclick = () => {
        modal.classList.add('active');
        window.loadHistoryList(false);
    };
    if (btnClose) btnClose.onclick = () => modal.classList.remove('active');

    const tabActivos = document.getElementById('tabHistActivos');
    const tabPapelera = document.getElementById('tabHistPapelera');
    if (tabActivos) tabActivos.addEventListener('click', (e) => {
        e.preventDefault();
        window.loadHistoryList(false);
    });
    if (tabPapelera) tabPapelera.addEventListener('click', (e) => {
        e.preventDefault();
        window.loadHistoryList(true);
    });
}

function initAdminPanel() {
    const modal = document.getElementById('adminModal');
    const btnOpen = document.getElementById('btnAdminPanel');
    const btnClose = document.getElementById('btnAdminClose');
    
    if (btnOpen && modal) {
        btnOpen.onclick = () => {
            modal.classList.add('active');
            window.loadAdminUsersList();
        };
    }
    if (btnClose && modal) {
        btnClose.onclick = () => modal.classList.remove('active');
    }
}

window.loadAdminUsersList = async () => {
    const tableBody = document.getElementById('adminUsersTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#64748b;">Cargando colegas...</td></tr>';
    
    try {
        const { data: users, error } = await supabaseClient
            .from('acceso_usuarios')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        tableBody.innerHTML = '';
        
        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#64748b; font-style:italic;">No hay colegas registrados aún.</td></tr>';
            return;
        }
        
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #f1f5f9';
            
            const isApproved = u.acceso_permitido;
            const statusBadge = isApproved 
                ? `<span style="background:#d1fae5; color:#0f5132; padding:3px 8px; border-radius:12px; font-weight:700; font-size:0.7rem; border:1px solid #badbcc; display:inline-block;">Habilitado</span>` 
                : `<span style="background:#fee2e2; color:#842029; padding:3px 8px; border-radius:12px; font-weight:700; font-size:0.7rem; border:1px solid #f5c2c7; display:inline-block;">Denegado</span>`;
                
            const actionButton = isApproved 
                ? `<button class="btn-micro" onclick="window.toggleUserAccess('${u.id}', false)" style="background:rgba(231,76,60,0.08); color:#e74c3c; border:1px solid rgba(231,76,60,0.15); padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.75rem;">Denegar</button>` 
                : `<button class="btn-micro" onclick="window.toggleUserAccess('${u.id}', true)" style="background:rgba(46,204,113,0.08); color:#2ecc71; border:1px solid rgba(46,204,113,0.15); padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.75rem;">Habilitar</button>`;
                
            tr.innerHTML = `
                <td style="padding:10px 12px; font-weight:600; color:#1e293b;">
                    <div style="font-size:0.85rem;">${u.nombre || 'Colega'}</div>
                    <div style="font-size:0.7rem; color:#64748b; font-weight:400;">${u.email}</div>
                </td>
                <td style="padding:10px 12px; text-align:center;">${statusBadge}</td>
                <td style="padding:10px 12px; text-align:center;">${actionButton}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error al cargar lista de usuarios en admin:", err);
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:15px; color:#e74c3c; font-weight:600;">Error: ${err.message}</td></tr>`;
    }
};

window.toggleUserAccess = async (userId, newStatus) => {
    try {
        const { error } = await supabaseClient
            .from('acceso_usuarios')
            .update({ acceso_permitido: newStatus })
            .eq('id', userId);
            
        if (error) throw error;
        
        showToast(newStatus ? "✔️ Colega habilitado para ingresar" : "❌ Acceso denegado para el colega");
        window.loadAdminUsersList();
    } catch (err) {
        console.error("Error al cambiar acceso de usuario:", err);
        showToast("⚠️ Error: " + err.message);
    }
};

// --- 7. PATIENT & HISTORY LOGIC ---
function initPatientLogic() {
    const fields = ['nombre', 'edad', 'sexo', 'peso', 'estatura', 'actividad', 'pcefalico'];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) {
            el.oninput = calculateRequirements;
            if (f === 'nombre') {
                el.addEventListener('change', (e) => {
                    if (typeof window.updatePatientEvolutionChart === 'function') {
                        window.updatePatientEvolutionChart(e.target.value);
                    }
                });
            }
            if (f === 'peso') {
                el.addEventListener('input', () => {
                    if (typeof window.updateDryWeight === 'function') {
                        window.updateDryWeight();
                    }
                });
            }
        }
    });
}

function initCompactLayout() {

    window.saveCurrentPatient = async (isReset = false) => {
        const form = document.getElementById('form-paciente');
        if (form) {
            form.dataset.isReset = isReset ? 'true' : 'false';
            const submitEvent = new Event('submit', { cancelable: true });
            form.dispatchEvent(submitEvent);
        }
    };

    const form = document.getElementById('form-paciente');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const isResetSignal = form.dataset.isReset === 'true';
            form.dataset.isReset = 'false';

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn ? btn.innerHTML : 'Guardar Paciente';

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span>⏳</span> Guardando...`;
            }

            try {
                const nombre = document.getElementById('nombre').value;
                const edad = parseInt(document.getElementById('edad').value) || 0;
                const peso = parseFloat(document.getElementById('peso').value) || 0;
                const estatura = parseFloat(document.getElementById('estatura').value) || 0;
                const sexo = document.getElementById('sexo').value;
                const actividad = parseFloat(document.getElementById('actividad').value) || 1.2;
                const diagnostico = document.getElementById('diagnostico')?.value || '';
                const cama = document.getElementById('cama')?.value || '';
                const tmt = parseFloat(document.getElementById('goalTotal')?.value) || 0;

                // FULL STATE PERSISTENCE V3.51
                const currentRegimen = (() => {
                    const dietSelect = document.getElementById('oralDietType');
                    if (dietSelect && dietSelect.value && dietSelect.value !== 'custom') {
                        const rawOpt = dietSelect.options[dietSelect.selectedIndex]?.text || '';
                        return rawOpt.replace(/\s*\(\d+\s*kcal\)/i, '').trim();
                    }
                    return AppState.patient.metadata?.regimen || '';
                })();
                const currentVia = document.getElementById('viaAlimentacionSelect')?.value || (AppState.patient.metadata?.via_alimentacion || 'auto');

                const metadata = {
                    patient_type: AppState.patient.type || 'adult',
                    regimen: currentRegimen,
                    via_alimentacion: currentVia,
                    fecha_nacimiento: document.getElementById('fechaNacimiento')?.value || '',
                    evo_examenes: document.getElementById('evoExamenes')?.value || '',
                    evo_tolerancia: document.getElementById('evoTolerancia')?.value || '',
                    anamnesis: AppState.patient.anamnesis || {},
                    neonatal: {
                        eg_semanas: document.getElementById('egSemanas')?.value || '',
                        eg_dias: document.getElementById('egDias')?.value || '',
                        peso_nacimiento: document.getElementById('pesoNacimiento')?.value || '',
                        talla_nacimiento: document.getElementById('tallaNacimiento')?.value || '',
                        pc_nacimiento: document.getElementById('pcNacimiento')?.value || '',
                        pcefalico: document.getElementById('pcefalico')?.value || ''
                    },
                    weight_history: AppState.patient.weight_history || [],
                    location: activeLocStr ? JSON.parse(activeLocStr) : null,
                    num_ficha: document.getElementById('num_ficha')?.value || '',
                    antecedentes_morbidos: document.getElementById('antecedentes_morbidos')?.value || '',
                    riesgo_lpp: document.getElementById('riesgo_lpp')?.value || 'Sin evaluar',
                    patologia_dm: document.getElementById('patologia_dm')?.checked || false,
                    patologia_hta: document.getElementById('patologia_hta')?.checked || false,
                    patologia_erc: document.getElementById('patologia_erc')?.checked || false,
                    fecha_ingreso_servicio: document.getElementById('fecha_ingreso_servicio')?.value || '',
                    nrs_score: (() => {
                        const pType = AppState.patient.type || 'adult';
                        if (pType === 'pediatric' || pType === 'neonate') {
                            if (AppState.patient.strongkids && AppState.patient.strongkids.score !== undefined) return `${AppState.patient.strongkids.score} pts`;
                            const skEl = document.getElementById('strongKidsTotalScore');
                            if (skEl && skEl.innerText && skEl.innerText !== '--') return skEl.innerText;
                        } else {
                            if (AppState.patient.nrs2002 && AppState.patient.nrs2002.score !== undefined) return `${AppState.patient.nrs2002.score} pts`;
                            const nrsEl = document.getElementById('nrsTotalScore');
                            if (nrsEl && nrsEl.innerText && nrsEl.innerText !== '--') return nrsEl.innerText;
                        }
                        return 'No evaluado';
                    })(),
                    screening_score: (() => {
                        const pType = AppState.patient.type || 'adult';
                        if (pType === 'pediatric' || pType === 'neonate') {
                            if (AppState.patient.strongkids && AppState.patient.strongkids.score !== undefined) return `${AppState.patient.strongkids.score} pts`;
                            const skEl = document.getElementById('strongKidsTotalScore');
                            if (skEl && skEl.innerText && skEl.innerText !== '--') return skEl.innerText;
                        } else {
                            if (AppState.patient.nrs2002 && AppState.patient.nrs2002.score !== undefined) return `${AppState.patient.nrs2002.score} pts`;
                            const nrsEl = document.getElementById('nrsTotalScore');
                            if (nrsEl && nrsEl.innerText && nrsEl.innerText !== '--') return nrsEl.innerText;
                        }
                        return 'No evaluado';
                    })(),
                    strongkids: AppState.patient.strongkids || {},
                    nrs2002: AppState.patient.nrs2002 || {},
                    observaciones_generales: document.getElementById('observaciones_generales')?.value || '',
                    simulator: {
                        formula: document.getElementById('formulaSelect')?.value || "",
                        volume: document.getElementById('volume')?.value || "",
                        volume_times: document.getElementById('volumeTimes')?.value || "1",
                        dilution: document.getElementById('dilution')?.value || "",
                        goal_total: tmt,
                        macro_mode: macroGoalMode || 'gkg',
                        goal_prot: document.getElementById('goalProtKg')?.value || "",
                        goal_cho: document.getElementById('goalCHOKg')?.value || "",
                        goal_lip: document.getElementById('goalLipKg')?.value || "",
                        estres: document.getElementById('estres')?.value || "1.0",
                        modules: {
                            nessucar: document.getElementById('modNessucar')?.value || "",
                            mct: document.getElementById('modMCT')?.value || "",
                            enterex: document.getElementById('modEnterex')?.value || "",
                            banatrol: document.getElementById('modBanatrol')?.value || "",
                            proteinex: document.getElementById('modProteinex')?.value || "",
                            fresubin: document.getElementById('modFresubin')?.value || ""
                        },
                        oral: {
                            kcal: document.getElementById('oralKcal')?.value || "",
                            prot: document.getElementById('oralProt')?.value || "",
                            cho: document.getElementById('oralCHO')?.value || "",
                            lip: document.getElementById('oralLip')?.value || "",
                            water: document.getElementById('oralWater')?.value || ""
                        },
                        iv: {
                            type: document.getElementById('ivType')?.value || "",
                            volume: document.getElementById('ivVolume')?.value || ""
                        }
                    },
                    assessment: {
                        cintura: document.getElementById('ccintura')?.value || "",
                        braquial: document.getElementById('cbraquial')?.value || "",
                        pantorrilla: document.getElementById('cpantorrilla')?.value || "",
                        atr: document.getElementById('altrodilla')?.value || "",
                        pliegues: {
                            pt: document.getElementById('ptricipital')?.value || "",
                            pb: document.getElementById('pbicipital')?.value || "",
                            ps: document.getElementById('piliaco')?.value || "",
                            pa: document.getElementById('pabdominal')?.value || ""
                        },
                        talla: {
                            mediaenv: document.getElementById('mediaenv')?.value || "",
                            envcomp: document.getElementById('envcomp')?.value || ""
                        },
                        edema: document.getElementById('edemaGrade')?.value || "",
                        exams: Array.from(document.querySelectorAll('#examsContainer .exam-row')).map(row => {
                            const inputs = row.querySelectorAll('input');
                            if(inputs && inputs.length >= 3) {
                                return { date: inputs[0].value, type: inputs[1].value, res: inputs[2].value };
                            }
                            return null;
                        }).filter(Boolean),
                        cribaje: {
                            nrs: document.getElementById('nrs2002')?.value || (AppState.patient.nrs2002 ? `${AppState.patient.nrs2002.score || 0} pts - ${AppState.patient.nrs2002.classification || ''}` : (document.getElementById('nrsTotalScore')?.innerText ? `${document.getElementById('nrsTotalScore').innerText} (${document.getElementById('nrsClassif')?.innerText || ''})` : "")),
                            vgs: document.getElementById('vgs')?.value || ""
                        },
                        gi: {
                            residuo: document.getElementById('residuo')?.value || "",
                            diarrea: document.getElementById('diarrea')?.value || "",
                            distension: document.getElementById('distension')?.value || ""
                        },
                        pes: document.getElementById('diagnosticoPES')?.value || ""
                    }
                };

                const data = {
                    nombre,
                    edad,
                    peso_kg: peso,
                    estatura_m: estatura,
                    sexo,
                    actividad,
                    diagnostico,
                    cama,
                    tmt,
                    ia_report: AppState.patient.ia_report || null,
                    metadata: metadata,
                    user_id: AppState.user.id
                };

                // Update local_ward_patients cache immediately if patient is in ward
                try {
                    let localWard = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
                    const wIdx = localWard.findIndex(p => p.id === AppState.patient.id || (p.cama && p.cama === cama && cama !== ''));
                    if (wIdx >= 0) {
                        localWard[wIdx] = {
                            ...localWard[wIdx],
                            nombre,
                            edad,
                            peso_kg: peso,
                            estatura_m: estatura,
                            talla_cm: Math.round(estatura > 3 ? estatura : estatura * 100),
                            sexo,
                            diagnostico,
                            metadata: {
                                ...(localWard[wIdx].metadata || {}),
                                ...metadata
                            }
                        };
                        localStorage.setItem('local_ward_patients', JSON.stringify(localWard));
                    }
                } catch(e) {}

                let error = null;
                if (AppState.patient.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(AppState.patient.id)) {
                    const res = await supabaseClient.from('pacientes').update(data).eq('id', AppState.patient.id);
                    error = res.error;
                } else {
                    const res = await supabaseClient.from('pacientes').insert([data]);
                    error = res.error;
                    if (!error && res.data && res.data[0]) {
                        AppState.patient.id = res.data[0].id;
                    }
                }

                if (!error) {
                    showToast("✅ Ficha completa guardada en historial");
                    window.loadHistoryList(false);

                    if (typeof updatePatientEvolutionChart === 'function') {
                        updatePatientEvolutionChart(nombre);
                    }

                    if (btn) {
                        btn.innerHTML = `<span>✔</span> ¡Guardado!`;
                    }
                    setTimeout(() => {
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = originalText;
                        }
                    }, 1500);
                } else {
                    throw error;
                }
            } catch (err) {
                console.error("Save Error:", err);
                alert("Error al guardar (Verifica caché SQL): " + err.message);
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        };
    }
}

// --- NEW: Goal Evolution Logic (Decoupled) ---
function initGoalLogic() {
    // Redundant block merged into initAssessmentLogic
}

window.loadHistoryList = async (showPapelera = false) => {
    if (!AppState.user || !AppState.user.id) {
        console.warn("loadHistoryList: AppState.user is not loaded yet. Skipping load.");
        const list = document.getElementById('patientListContainer');
        if (list) {
            list.innerHTML = '<p style="text-align:center; opacity:0.6;">Cargando tus registros...</p>';
        }
        return;
    }

    const tabActivos = document.getElementById('tabHistActivos');
    const tabPapelera = document.getElementById('tabHistPapelera');
    if (tabActivos) {
        if (showPapelera) tabActivos.classList.remove('active');
        else tabActivos.classList.add('active');
    }
    if (tabPapelera) {
        if (showPapelera) tabPapelera.classList.add('active');
        else tabPapelera.classList.remove('active');
    }

    const list = document.getElementById('patientListContainer');
    if (!list) return;

    list.innerHTML = '<p style="text-align:center;">Cargando historial...</p>';

    const { data: records, error } = await supabaseClient
        .from('pacientes')
        .select('*, metadata')
        .eq('user_id', AppState.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        let msg = error.message || "Error desconocido";
        if (msg.includes("estado_sala")) msg = "Columna estado_sala inexistente. ¡Corre el SQL!";
        list.innerHTML = `<p style="text-align:center; color:#e74c3c;"><b>Error al cargar:</b> ${msg}</p>`;
        return;
    }

    if (!records || records.length === 0) {
        list.innerHTML = '<p style="text-align:center; opacity:0.6;">Ningún registro guardado aún.</p>';
        return;
    }

    let validRecords = records.filter(r => r.nombre && r.nombre.trim() !== '');
    if (window.restrictedHistoryWard) {
        const activeLocStr = localStorage.getItem('activeLocation');
        if (activeLocStr) {
            const activeLoc = JSON.parse(activeLocStr);
            validRecords = validRecords.filter(r => 
                r.metadata?.location &&
                r.metadata.location.floor === activeLoc.floor &&
                r.metadata.location.serviceId === activeLoc.serviceId
            );
        }
    }
    const now = new Date();
    const toHardDelete = [];
    const showRecords = [];

    validRecords.forEach(r => {
        const isTrash = r.estado_sala === 'eliminado';
        if (isTrash) {
            const delDateStr = r.metadata?.deleted_at;
            let daysLeft = 30;
            if (delDateStr) {
                const diffTime = Math.abs(now - new Date(delDateStr));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysLeft = 30 - diffDays;
            } else {
                let meta = r.metadata || {};
                meta.deleted_at = new Date().toISOString();
                supabaseClient.from('pacientes').update({ metadata: meta }).eq('id', r.id).then(()=>{});
                daysLeft = 30;
            }

            if (daysLeft <= 0) {
                toHardDelete.push(r.id);
            } else if (showPapelera) {
                r._daysLeft = daysLeft;
                showRecords.push(r);
            }
        } else if (!showPapelera && r.estado_sala !== 'eliminado') {
            showRecords.push(r);
        }
    });

    toHardDelete.forEach(async (id) => {
        console.log(`Auto-purging expired patient ${id}`);
        await supabaseClient.from('pacientes').delete().eq('id', id);
    });

    // Save globally so we can filter client-side
    window.lastHistoryRecords = showRecords;

    // Populate service filter dropdown
    const serviceFilter = document.getElementById('historyServiceFilter');
    if (serviceFilter) {
        const services = new Set();
        showRecords.forEach(r => {
            const sName = r.metadata?.location?.serviceName;
            if (sName) services.add(sName);
        });

        let filterHtml = '<option value="all">-- Todos los Servicios --</option>';
        Array.from(services).sort().forEach(s => {
            filterHtml += `<option value="${s}">${s}</option>`;
        });
        const currentVal = serviceFilter.value;
        serviceFilter.innerHTML = filterHtml;
        if (Array.from(services).includes(currentVal)) {
            serviceFilter.value = currentVal;
        } else {
            serviceFilter.value = 'all';
        }
    }

    window.renderFilteredHistory();
};

window.toggleMonthAccordion = function(monthKey) {
    const content = document.getElementById(`content-${monthKey}`);
    const arrow = document.getElementById(`arrow-${monthKey}`);
    if (content) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'flex' : 'none';
        if (arrow) arrow.innerText = isHidden ? '▼' : '►';
    }
};

window.reactivateDischargedPatient = async function(id) {
    if (!supabaseClient) return;
    if (!confirm("¿Deseas reingresar a este paciente a la sala activa?")) return;

    const { data: p } = await supabaseClient.from('pacientes').select('metadata').eq('id', id).single();
    const updatedMeta = { ...(p?.metadata || {}), service_admitted_at: new Date().toISOString() };
    delete updatedMeta.discharged_at;

    const { error } = await supabaseClient
        .from('pacientes')
        .update({ estado_sala: 'activo', metadata: updatedMeta })
        .eq('id', id);

    if (!error) {
        showToast("↩ Paciente reingresado a la sala activa.");
        if (typeof window.loadHistoryList === 'function') await window.loadHistoryList(false);
        await window.renderWardBedsGrid();
    } else {
        alert("Error al reingresar paciente: " + error.message);
    }
};

window.renderFilteredHistory = () => {
    const list = document.getElementById('patientListContainer');
    if (!list) return;

    let filtered = window.lastHistoryRecords || [];
    if (!window.restrictedHistoryWard) {
        const filterVal = document.getElementById('historyServiceFilter')?.value || 'all';
        if (filterVal !== 'all') {
            filtered = filtered.filter(r => r.metadata?.location?.serviceName === filterVal);
        }
    }

    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center; opacity:0.6; padding:20px;">No se encontraron casos guardados para el filtro seleccionado.</p>';
        return;
    }

    // Check if we are showing Trash items
    const isShowingTrash = filtered.some(r => r.estado_sala === 'eliminado');
    if (isShowingTrash) {
        let trashHtml = '';
        filtered.forEach(r => {
            const dateObj = new Date(r.created_at);
            const dateStr = dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
            trashHtml += `
                <div class="history-card trash" style="background:#fffaf8; border:1px solid #fed7aa; border-radius:12px; padding:12px 16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                        <strong style="color:#7c2d12; font-size:0.95rem;">${r.nombre} (Ficha: ${r.metadata?.num_ficha || '--'})</strong>
                        <span style="font-size:0.75rem; color:#9a3412;">⚠️ Se eliminará definitivamente en <b>${r._daysLeft} días</b> | Creado: ${dateStr}</span>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem; background:#10b981; border:none; color:white; border-radius:6px;" onclick="window.restorePatient('${r.id}')">↩ Restaurar</button>
                        <button class="btn-micro" style="padding: 6px; font-size: 0.85rem; background: rgba(239, 68, 68, 0.08); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px;" onclick="event.stopPropagation(); window.hardDeletePatient('${r.id}')" title="Eliminar definitivamente">🗑</button>
                    </div>
                </div>
            `;
        });
        list.innerHTML = trashHtml;
        return;
    }

    // Grouping by Month for CASOS
    const groups = {};
    filtered.forEach(r => {
        const dateRef = r.metadata?.discharged_at || r.created_at;
        const d = new Date(dateRef);
        const year = d.getFullYear();
        const monthNum = d.getMonth(); // 0-indexed
        const monthKey = `${year}-${String(monthNum + 1).padStart(2, '0')}`;

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const monthLabel = `${monthNames[monthNum]} ${year}`;

        if (!groups[monthKey]) {
            groups[monthKey] = {
                label: monthLabel,
                records: []
            };
        }
        groups[monthKey].records.push(r);
    });

    // Sort month keys descending (newest month first)
    const sortedKeys = Object.keys(groups).sort().reverse();

    let accordionHTML = '';
    sortedKeys.forEach((key, index) => {
        const group = groups[key];
        const isFirstMonth = index === 0; // First month expanded by default

        let cardsHtml = '';
        group.records.forEach(r => {
            // Stay calculation
            const firstAdmit = r.metadata?.first_hospital_admitted_at || r.metadata?.fecha_ingreso_servicio || r.created_at;
            const serviceAdmit = r.metadata?.service_admitted_at || r.metadata?.fecha_ingreso_servicio || r.created_at;
            const dischargeTime = r.metadata?.discharged_at || new Date().toISOString();

            const daysInHospital = Math.max(1, Math.ceil(Math.abs(new Date(dischargeTime) - new Date(firstAdmit)) / (1000 * 60 * 60 * 24)));
            const daysInService = Math.max(1, Math.ceil(Math.abs(new Date(dischargeTime) - new Date(serviceAdmit)) / (1000 * 60 * 60 * 24)));

            // Transfer route badge
            let transferRouteHtml = '';
            if (Array.isArray(r.metadata?.transfer_history) && r.metadata.transfer_history.length > 0) {
                const routeNames = r.metadata.transfer_history.map(t => t.name || `Piso ${t.floor}`);
                if (r.metadata?.location?.name) routeNames.push(r.metadata.location.name);
                transferRouteHtml = `<span class="case-route-tag" title="Ruta de traslados recorridos">🗺️ ${routeNames.join(' ➔ ')}</span>`;
            } else if (r.metadata?.location?.name) {
                transferRouteHtml = `<span class="case-route-tag">📍 ${r.metadata.location.name}</span>`;
            }

            const isDischarged = r.estado_sala === 'de_alta';

            cardsHtml += `
                <div class="case-card-compact">
                    <div class="case-info-main">
                        <div class="case-patient-title">
                            <strong class="patient-name" onclick="loadPatient('${r.id}')" title="Ver Ficha">${r.nombre}</strong>
                            <span class="patient-ficha">Ficha: ${r.metadata?.num_ficha || '--'}</span>
                            <span class="patient-demo">${r.edad ? r.edad + ' años' : ''} ${r.sexo ? '(' + r.sexo.toUpperCase() + ')' : ''}</span>
                            ${isDischarged ? '<span class="status-pill discharged">✔️ Dado de Alta</span>' : '<span class="status-pill active">🏥 En Censo</span>'}
                        </div>
                        <div class="case-meta-bar">
                            ${transferRouteHtml}
                            <span class="stay-badge total" title="Días totales transcurridos hospitalizado">🏥 Total Hosp: <b>${daysInHospital} días</b></span>
                            <span class="stay-badge service" title="Días transcurridos en esta sala/servicio">🛌 En Sala: <b>${daysInService} días</b></span>
                        </div>
                        <div class="case-clinical-snippet">
                            <span class="diag-text" title="${r.diagnostico || ''}">📋 ${r.diagnostico ? (r.diagnostico.length > 60 ? r.diagnostico.slice(0, 60) + '...' : r.diagnostico) : 'Sin diagnóstico registrado'}</span>
                            <span class="diet-text">🍲 ${r.metadata?.regimen || 'Régimen s/ind'}</span>
                        </div>
                    </div>
                    <div class="case-actions">
                        <button class="btn-case-action load" onclick="loadPatient('${r.id}')" title="Ver Ficha">📂 Ficha</button>
                        <button class="btn-case-action restore" onclick="event.stopPropagation(); window.reactivateDischargedPatient('${r.id}')" title="Reingresar paciente a la sala activa">↩ Reingresar</button>
                        <button class="btn-case-action trash" onclick="event.stopPropagation(); window.deletePatient('${r.id}')" title="Mover a Papelera">🗑️</button>
                    </div>
                </div>
            `;
        });

        accordionHTML += `
            <div class="month-accordion" id="accordion-${key}">
                <div class="month-accordion-header" onclick="window.toggleMonthAccordion('${key}')">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="accordion-arrow" id="arrow-${key}">${isFirstMonth ? '▼' : '►'}</span>
                        <strong style="font-size:1.05rem; color:#312e81;">📅 ${group.label}</strong>
                    </div>
                    <span class="month-count-badge">${group.records.length} ${group.records.length === 1 ? 'Caso Clínico' : 'Casos Clínicos'}</span>
                </div>
                <div class="month-accordion-content" id="content-${key}" style="display: ${isFirstMonth ? 'flex' : 'none'}; flex-direction: column; gap: 8px; padding-top: 10px;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    });

    list.innerHTML = accordionHTML;
};

// --- NEW V3.60: WARD KANBAN LOGIC ---
function initWardKanban() {
    const btnRefresh = document.getElementById('btnRefreshWard');
    if (btnRefresh) btnRefresh.onclick = loadWardKanban;

    const btnPrint = document.getElementById('btnPrintHandoff');
    if (btnPrint) btnPrint.onclick = generateShiftHandoff;

    const btnQuickClose = document.getElementById('btnQuickViewClose');
    if (btnQuickClose) btnQuickClose.onclick = () => document.getElementById('quickViewModal').classList.remove('active');
}

async function loadWardKanban() {
    await window.initCensusModal && window.initCensusModal();
    window.renderWardBedsGrid();
}

window.togglePatientState = async (id, newState) => {
    const { error } = await supabaseClient.from('pacientes').update({ estado_sala: newState }).eq('id', id);
    if (error) {
        console.error("Error toggling patient state:", error);
        alert("Error al cambiar estado: " + error.message);
    } else {
        loadWardKanban();
    }
};

async function resolvePatientDbId(id) {
    if (!id) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) return id;

    let localCache = [];
    try {
        localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
    } catch (e) {
        localCache = [];
    }
    const localPat = localCache.find(p => p && p.id === id);

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        if (localPat && localPat.cama) {
            const { data: matchBed } = await supabaseClient
                .from('pacientes')
                .select('id')
                .eq('cama', localPat.cama)
                .neq('estado_sala', 'de_alta')
                .neq('estado_sala', 'eliminado')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (matchBed && matchBed.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchBed.id)) {
                return matchBed.id;
            }
        }
        if (localPat && localPat.nombre) {
            const { data: matchName } = await supabaseClient
                .from('pacientes')
                .select('id')
                .eq('nombre', localPat.nombre)
                .neq('estado_sala', 'de_alta')
                .neq('estado_sala', 'eliminado')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (matchName && matchName.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchName.id)) {
                return matchName.id;
            }
        }
    }
    return null;
}

window.dischargePatient = async (id) => {
    if (!confirm("¿Dar de alta a este paciente de la sala? Seguirá en tu historial, pero no en este Kanban.")) return;
    
    const dbId = await resolvePatientDbId(id);
    let currentMeta = {};
    const nowIso = new Date().toISOString();

    if (dbId && typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data: p } = await supabaseClient.from('pacientes').select('metadata').eq('id', dbId).maybeSingle();
        if (p && p.metadata) {
            currentMeta = { ...p.metadata };
        }
        currentMeta.discharged_at = nowIso;
        
        const { error } = await supabaseClient.from('pacientes').update({ 
            estado_sala: 'de_alta',
            metadata: currentMeta
        }).eq('id', dbId);

        if (error) {
            console.warn("Supabase discharge error:", error.message);
        }
    }

    try {
        let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        localCache = localCache.filter(p => p && p.id !== id && p.id !== dbId);
        localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
    } catch(e) {}

    showToast("✅ Paciente dado de alta.");
    if (typeof window.loadHistoryList === 'function') {
        await window.loadHistoryList(false);
    }
    if (typeof loadWardKanban === 'function') loadWardKanban();
};

window.deletePatient = async (id) => {
    if (!AppState.user || !AppState.user.id) {
        alert("⚠️ Error: Sesión de usuario no válida.");
        return;
    }

    if (!confirm("¿Mover este paciente a la papelera?")) return;

    const dbId = await resolvePatientDbId(id);
    const targetId = dbId || id;
    const nowISO = new Date().toISOString();

    const { data: p } = await supabaseClient.from('pacientes').select('nombre, metadata').eq('id', targetId).maybeSingle();
    let meta = p?.metadata || {};
    meta.deleted_at = nowISO;

    const { error } = await supabaseClient.from('pacientes').update({
        estado_sala: 'eliminado',
        metadata: meta
    }).eq('id', targetId);

    if (error) {
        console.error("Error API:", error.message);
        alert("Falla de conexión o base de datos: " + error.message);
    } else {
        showToast("✅ Paciente movido a la papelera");
        if (typeof window.loadHistoryList === 'function') window.loadHistoryList(false);
        if (typeof loadWardKanban === 'function') loadWardKanban();

        if (p && p.nombre) {
            const currentName = document.getElementById('nombre')?.value || "";
            if (currentName.trim() === p.nombre.trim()) {
                AppState.patient.id = null;
                document.getElementById('nombre').value = "";
                document.getElementById('currentPatientName').innerText = "Nuevo Paciente";
                if (document.getElementById('currentPatientAvatar')) document.getElementById('currentPatientAvatar').innerText = "P";
                if (document.getElementById('valBMI')) document.getElementById('valBMI').innerText = "--";
            }
        }
    }
};

window.hardDeletePatient = async (id, skipConfirm = false) => {
    if (!AppState.user || !AppState.user.id) {
        alert("⚠️ Error: Sesión de usuario no válida.");
        return;
    }

    if (!skipConfirm && !confirm("¿Eliminar PERMANENTEMENTE a este registro de paciente de la base de datos?")) return;

    const dbId = await resolvePatientDbId(id);
    const targetId = dbId || id;

    const { data: p } = await supabaseClient.from('pacientes').select('nombre').eq('id', targetId).maybeSingle();
    const { error } = await supabaseClient.from('pacientes').delete().eq('id', targetId);

    if (!error) {
        showToast("✅ Registro eliminado permanentemente");
        if (typeof window.loadHistoryList === 'function') window.loadHistoryList(false);
        if (typeof loadWardKanban === 'function') loadWardKanban();

        if (p && p.nombre) {
            const currentName = document.getElementById('nombre')?.value || "";
            if (currentName.trim() === p.nombre.trim()) {
                AppState.patient.id = null;
                document.getElementById('nombre').value = "";
                document.getElementById('currentPatientName').innerText = "Nuevo Paciente";
                if (document.getElementById('currentPatientAvatar')) document.getElementById('currentPatientAvatar').innerText = "P";
                if (document.getElementById('valBMI')) document.getElementById('valBMI').innerText = "--";
            }
        }
    } else {
        alert("Error de Supabase al eliminar: " + error.message);
    }
};

window.restorePatient = async (id) => {
    if (!AppState.user || !AppState.user.id) {
        alert("⚠️ Error: Sesión de usuario no válida.");
        return;
    }

    // Return to generic 'activo' state for all history rows tied to this name
    const { data: p, error: fetchErr } = await supabaseClient.from('pacientes').select('nombre, cama, metadata').eq('id', id).single();
    if (fetchErr || !p) {
        alert("No se pudo restaurar (error de lectura): " + (fetchErr?.message || ""));
        return;
    }

    let targetBed = p.cama || '';
    if (targetBed) {
        // Check if another active patient is currently in this bed
        const { data: activeOnBed } = await supabaseClient
            .from('pacientes')
            .select('nombre')
            .eq('cama', targetBed)
            .neq('nombre', p.nombre)
            .neq('estado_sala', 'de_alta')
            .neq('estado_sala', 'eliminado')
            .eq('user_id', AppState.user.id);
            
        if (activeOnBed && activeOnBed.length > 0) {
            const conflictingName = activeOnBed[0].nombre;
            const confirmRestore = confirm(`⚠️ Conflicto de Cama: La cama "${targetBed}" está ocupada actualmente por "${conflictingName}".\n\n¿Deseas restaurar a "${p.nombre}" en la sección de "Cupos del Servicio" (sin cama asignada)?`);
            if (!confirmRestore) return; // Cancel operation
            targetBed = ''; // Clear bed so they appear in generic room group / service slots
        }
    }

    const { error } = await supabaseClient
        .from('pacientes')
        .update({ 
            estado_sala: 'activo',
            cama: targetBed
        })
        .eq('nombre', p.nombre)
        .eq('user_id', AppState.user.id);

    if (!error) {
        window.loadHistoryList(true);
        if (typeof loadWardKanban === 'function') loadWardKanban();
    } else {
        alert("Error restaurando paciente: " + error.message);
    }
};

window.openQuickView = async (id) => {
    const modal = document.getElementById('quickViewModal');
    const content = document.getElementById('quickViewContent');
    if (!modal || !content) return;

    content.innerHTML = '<p style="text-align:center; opacity:0.5;">Cargando paciente...</p>';
    modal.classList.add('active');

    const { data: p, error } = await supabaseClient.from('pacientes').select('*').eq('id', id).single();

    if (error || !p) {
        content.innerHTML = '<p style="color:red;">Error al cargar datos.</p>';
        return;
    }

    // Try to extract prescribed formula name from metadata if possible, otherwise generic
    let formulaDesc = "Fórmula Enteral";
    let volDesc = "--";
    let velDesc = "--";

    if (p.metadata) {
        if (p.metadata.prescripcion) {
            formulaDesc = p.metadata.prescripcion.formula_id || formulaDesc;
            volDesc = p.metadata.prescripcion.volumen ? `${p.metadata.prescripcion.volumen} ml` : volDesc;
        }
    }

    const html = `
        <div style="text-align:center; margin-bottom:15px;">
            <div style="font-size:2.5rem; margin-bottom:5px;">🛏️</div>
            <h3 style="color:var(--primary); margin:0;">${p.nombre}</h3>
            <span style="font-size:0.8rem; background:#f0f2f5; padding:2px 8px; border-radius:10px;">Cama ${p.cama || 'S/N'}</span>
        </div>
        
        <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
            <tr><td style="padding:6px; border-bottom:1px solid #eee; color:#666;">Edad/Género</td><td style="padding:6px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${p.edad}a / ${p.sexo === 'm' ? 'Masc' : 'Fem'}</td></tr>
            <tr><td style="padding:6px; border-bottom:1px solid #eee; color:#666;">Peso Actual</td><td style="padding:6px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${p.peso_kg} kg</td></tr>
            <tr><td style="padding:6px; border-bottom:1px solid #eee; color:#666;">Meta (TMT)</td><td style="padding:6px; border-bottom:1px solid #eee; font-weight:600; text-align:right; color:var(--primary);">${p.tmt ? Math.round(p.tmt) + ' kcal' : '--'}</td></tr>
        </table>

        <div style="background:#f8f9fa; padding:12px; border-radius:12px; margin-bottom:15px; border-left:4px solid #3498db;">
            <p style="margin:0 0 5px 0; font-size:0.75rem; color:#888; text-transform:uppercase;">Esquema Actual Registrado</p>
            <strong style="display:block; font-size:1.1rem; color:#333;">${formulaDesc}</strong>
            <span style="font-size:0.85rem; color:#555;">Volumen: ${volDesc}</span>
        </div>

        <div>
            <p style="margin:0 0 5px 0; font-size:0.75rem; color:#888; text-transform:uppercase;">Diagnóstico / Evolución</p>
            <div style="font-size:0.85rem; color:#444; background:#fdfdfd; padding:10px; border-radius:8px; border:1px solid #eee;">
                ${p.diagnostico || 'Sin diagnóstico ingresado.'}
            </div>
        </div>
    `;

    content.innerHTML = html;
};

async function generateShiftHandoff() {
    if (!AppState.user || !AppState.user.id) {
        alert("⚠️ Error: Sesión de usuario no válida.");
        return;
    }

    const { data: patients, error } = await supabaseClient
        .from('pacientes')
        .select('*')
        .eq('user_id', AppState.user.id)
        .neq('estado_sala', 'de_alta')
        .order('cama', { ascending: true, nullsFirst: false });

    if (error || !patients || patients.length === 0) {
        alert("No hay pacientes activos en la sala para generar el reporte.");
        return;
    }

    // Filter unique latest per patient handling deleted/discharged patients
    const activeMap = new Map();
    patients.forEach(p => {
        if (p.estado_sala === 'de_alta' || p.estado_sala === 'eliminado') return;

        if (!activeMap.has(p.nombre) || new Date(p.created_at) > new Date(activeMap.get(p.nombre).created_at)) {
            activeMap.set(p.nombre, p);
        }
    });

    const uniquePatients = Array.from(activeMap.values());
    uniquePatients.sort((a, b) => (a.cama || '').localeCompare(b.cama || ''));

    let rows = '';
    uniquePatients.forEach(p => {
        rows += `
            <tr>
                <td><b>${p.cama || '--'}</b></td>
                <td><b>${p.nombre}</b><br><span style="font-size:0.75rem; color:#555;">${p.edad}a | ${p.peso_kg}kg</span></td>
                <td>${p.diagnostico || '--'}</td>
                <td>${p.tmt ? Math.round(p.tmt) : '--'} kcal</td>
                <td>${p.estado_sala === 'critico' ? '⚠️  CRÍTICO' : 'En Curso'}</td>
            </tr>
        `;
    });

    const reportHTML = `
        <div style="text-align:center; margin-bottom:20px; font-family:'Poppins', sans-serif;">
            <h2 style="margin:0; color:#333;">🏥 Reporte Entrega de Turno: SEDILE HRA</h2>
            <p style="margin:5px 0 0 0; color:#666;">Generado el: ${new Date().toLocaleString('es-CL')}</p>
        </div>
        <table class="print-table">
            <thead>
                <tr>
                    <th style="width:10%;">Cama</th>
                    <th style="width:25%;">Paciente</th>
                    <th style="width:40%;">Diagnóstico / Evolución</th>
                    <th style="width:10%;">Meta</th>
                    <th style="width:15%;">Estado</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div style="margin-top:30px; font-size:0.8rem; color:#888; text-align:center; font-family:'Poppins', sans-serif;">
            "La nutrición adecuada es vital para la recuperación."
        </div>
    `;

    const printArea = document.getElementById('printHandoffArea');
    if (printArea) {
        printArea.innerHTML = reportHTML;
        window.print();
    }
}

function renderEvolutionChart(history) {
    const canvas = document.getElementById('evolutionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 25;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get weights from AppState / inputs
    const currentWeightInput = AppState.patient?.peso || parseFloat(document.getElementById('peso')?.value) || 0;
    const pesoAnteriorInput = parseFloat(document.getElementById('pesoAnterior')?.value) || 0;
    
    // Prepare combined history to plot: previous weight + history + current weight
    let plotData = [];
    
    // 1. Add Previous Weight as the starting point if valid and not already in history
    if (pesoAnteriorInput > 0) {
        plotData.push({ peso_kg: pesoAnteriorInput, isPrevious: true });
    }
    
    // 2. Add recorded history points, skipping duplicates of Previous Weight
    if (history && history.length > 0) {
        history.forEach(h => {
            if (h.peso_kg !== pesoAnteriorInput) {
                plotData.push(h);
            }
        });
    }
    
    // 3. Add Current Weight if it's set, not already in plotData, and different from Previous Weight
    const isCurrentInHistory = plotData.length > 0 && plotData[plotData.length - 1].peso_kg === currentWeightInput;
    if (currentWeightInput > 0 && !isCurrentInHistory && currentWeightInput !== pesoAnteriorInput) {
        plotData.push({ peso_kg: currentWeightInput, isCurrent: true });
    }

    // --- MANEJO DE LA TABLA DE PESO EN TIEMPO REAL ---
    const tableBody = document.getElementById('evolutionTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        if (plotData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="padding:15px; text-align:center; color:#94a3b8; font-style:italic;">
                        Sin registros de peso en el historial
                    </td>
                </tr>
            `;
        } else {
            // Mostrar los registros del más reciente al más antiguo (descendente)
            const tableData = [...plotData].reverse();
            tableData.forEach(h => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f1f5f9';
                tr.style.transition = 'background 0.2s';
                
                // Efectos visuales de hover
                tr.onmouseenter = () => tr.style.background = '#f8fafc';
                tr.onmouseleave = () => tr.style.background = 'transparent';

                let dateStr = '';
                let statusBadge = '';

                if (h.isCurrent) {
                    dateStr = `<span style="color:#e74c3c; font-weight:700;">[Peso Actual (Temporal)]</span>`;
                    statusBadge = `<span style="background:#fff3cd; color:#856404; padding:2px 8px; border-radius:12px; font-weight:700; border:1px solid #ffeeba; font-size:0.65rem; display:inline-block;">Actual</span>`;
                    tr.style.background = 'rgba(243, 156, 18, 0.05)';
                    tr.onmouseleave = () => tr.style.background = 'rgba(243, 156, 18, 0.05)';
                } else if (h.isPrevious) {
                    dateStr = `<span style="color:#3498db; font-weight:700;">[Peso Anterior]</span>`;
                    statusBadge = `<span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:12px; font-weight:700; border:1px solid #bae6fd; font-size:0.65rem; display:inline-block;">Anterior</span>`;
                    tr.style.background = 'rgba(52, 152, 219, 0.05)';
                    tr.onmouseleave = () => tr.style.background = 'rgba(52, 152, 219, 0.05)';
                } else {
                    const dateObj = h.created_at ? new Date(h.created_at) : (h.metadata?.logged_at ? new Date(h.metadata.logged_at) : new Date());
                    dateStr = dateObj.toLocaleString('es-CL', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    statusBadge = `<span style="background:#d1fae5; color:#0f5132; padding:2px 8px; border-radius:12px; font-weight:700; border:1px solid #badbcc; font-size:0.65rem; display:inline-block;">Registrado</span>`;
                }

                tr.innerHTML = `
                    <td style="padding:10px; color:#475569; font-weight:600;">${dateStr}</td>
                    <td style="padding:10px; text-align:right; color:#1e293b; font-weight:800; font-size:0.8rem;">${h.peso_kg.toFixed(1)} kg</td>
                    <td style="padding:10px; text-align:center;">${statusBadge}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    if (plotData.length === 0) {
        ctx.fillStyle = '#aaa';
        ctx.font = 'italic 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sin registros de evolución', width / 2, height / 2);
        return;
    }

    // Reference Weights from AppState
    const pesoIdeal = AppState.patient?.peso_ideal || 0;
    const pesoAjustado = AppState.patient?.peso_ajustado || 0;

    // Normalize Data
    const weights = plotData.map(h => h.peso_kg);
    let allReferenceWeights = [pesoIdeal, pesoAjustado].filter(w => w > 0);

    const maxW = Math.max(...weights, ...allReferenceWeights) + 2;
    const minW = Math.max(0, Math.min(...weights, ...allReferenceWeights) - 2);
    const xStep = (plotData.length > 1) ? (width - 2 * padding) / (plotData.length - 1) : 0;

    const getY = (w) => {
        if (maxW === minW) return height / 2;
        return height - padding - ((w - minW) / (maxW - minW) * (height - 2 * padding));
    };

    // Draw Reference Lines FIRST
    if (pesoIdeal > 0) {
        const yIdeal = getY(pesoIdeal);
        ctx.beginPath();
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)'; // Greenish for Ideal
        ctx.lineWidth = 1;
        ctx.moveTo(padding, yIdeal);
        ctx.lineTo(width - padding, yIdeal);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#27ae60';
        ctx.font = '8px Arial';
        ctx.fillText('Ideal', 5, yIdeal + 3);
    }

    if (pesoAjustado > 0) {
        const yAdj = getY(pesoAjustado);
        ctx.beginPath();
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = 'rgba(243, 156, 18, 0.5)'; // Orange for Adjusted
        ctx.lineWidth = 1;
        ctx.moveTo(padding, yAdj);
        ctx.lineTo(width - padding, yAdj);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f39c12';
        ctx.font = '8px Arial';
        ctx.fillText('Ajust.', 5, yAdj + 3);
    }

    // Draw Axis
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw Evolution Line
    if (plotData.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#8e44ad'; // Purple theme matching card color
        ctx.lineWidth = 2.5;
        plotData.forEach((h, i) => {
            const x = padding + i * xStep;
            const y = getY(h.peso_kg);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    // Draw Points
    plotData.forEach((h, i) => {
        const x = (plotData.length > 1) ? padding + i * xStep : width / 2;
        const y = getY(h.peso_kg);
        
        // RED dot for current, Blue for previous, Purple/Orange for history
        if (h.isCurrent) {
            ctx.fillStyle = '#e74c3c';
        } else if (h.isPrevious) {
            ctx.fillStyle = '#3498db';
        } else {
            ctx.fillStyle = '#8e44ad'; 
        }
        
        ctx.beginPath();
        ctx.arc(x, y, (h.isCurrent || h.isPrevious) ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = h.isCurrent ? '#e74c3c' : (h.isPrevious ? '#3498db' : '#333');
        ctx.font = (h.isCurrent || h.isPrevious) ? 'bold 10px Arial' : 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(h.peso_kg, x, y - 8);
    });
}

// === CALCULADORA DE % PÉRDIDA DE PESO ===
window.calculateWeightLoss = () => {
    const ph = parseFloat(document.getElementById('lossPesoHabitual')?.value) || 0;
    const pn = parseFloat(document.getElementById('lossPesoActual')?.value) || 0;
    const interval = document.getElementById('lossInterval')?.value || '1m';
    
    const pctValEl = document.getElementById('lossPercentValue');
    const badgeEl = document.getElementById('lossClassificationBadge');
    
    if (!pctValEl || !badgeEl) return;
    
    if (ph <= 0 || pn <= 0) {
        pctValEl.innerText = '0.0%';
        badgeEl.style.display = 'none';
        return;
    }
    
    const pct = ((ph - pn) / ph) * 100;
    pctValEl.innerText = pct.toFixed(1) + '%';
    
    if (pct < 0) {
        badgeEl.innerText = 'Ganancia';
        badgeEl.style.display = 'inline-block';
        badgeEl.style.background = '#d1fae5';
        badgeEl.style.color = '#0f5132';
        badgeEl.style.border = '1px solid #badbcc';
        return;
    } else if (pct === 0) {
        badgeEl.innerText = 'Sin cambio';
        badgeEl.style.display = 'inline-block';
        badgeEl.style.background = '#f1f5f9';
        badgeEl.style.color = '#475569';
        badgeEl.style.border = '1px solid #cbd5e1';
        return;
    }
    
    // ASPEN Clinical Criteria for Weight Loss Severity
    let severity = 'Pérdida Leve';
    let bgColor = '#dbeafe';
    let textColor = '#1e40af';
    let borderColor = '#bfdbfe';
    
    if (interval === '1w') {
        if (pct > 2.0) {
            severity = 'Severa (>2%)';
            bgColor = '#fee2e2';
            textColor = '#991b1b';
            borderColor = '#fecaca';
        } else if (pct >= 1.0) {
            severity = 'Moderada (1-2%)';
            bgColor = '#ffedd5';
            textColor = '#c2410c';
            borderColor = '#fed7aa';
        } else {
            severity = 'Leve (<1%)';
        }
    } else if (interval === '1m') {
        if (pct > 5.0) {
            severity = 'Severa (>5%)';
            bgColor = '#fee2e2';
            textColor = '#991b1b';
            borderColor = '#fecaca';
        } else if (pct >= 1.0) {
            severity = 'Moderada (1-5%)';
            bgColor = '#ffedd5';
            textColor = '#c2410c';
            borderColor = '#fed7aa';
        } else {
            severity = 'Leve (<1%)';
        }
    } else if (interval === '3m') {
        if (pct > 7.5) {
            severity = 'Severa (>7.5%)';
            bgColor = '#fee2e2';
            textColor = '#991b1b';
            borderColor = '#fecaca';
        } else if (pct >= 1.0) {
            severity = 'Moderada (1-7.5%)';
            bgColor = '#ffedd5';
            textColor = '#c2410c';
            borderColor = '#fed7aa';
        } else {
            severity = 'Leve (<1%)';
        }
    } else if (interval === '6m') {
        if (pct > 10.0) {
            severity = 'Severa (>10%)';
            bgColor = '#fee2e2';
            textColor = '#991b1b';
            borderColor = '#fecaca';
        } else if (pct >= 1.0) {
            severity = 'Moderada (1-10%)';
            bgColor = '#ffedd5';
            textColor = '#c2410c';
            borderColor = '#fed7aa';
        } else {
            severity = 'Leve (<1%)';
        }
    }
    
    badgeEl.innerText = severity;
    badgeEl.style.display = 'inline-block';
    badgeEl.style.background = bgColor;
    badgeEl.style.color = textColor;
    badgeEl.style.border = '1px solid ' + borderColor;
}

function logWeightToHistory(weight) {
    if (weight <= 0) return;
    const p = AppState.patient;
    if (!p) return;

    if (!p.weight_history) {
        p.weight_history = [];
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const timestamp = now.toISOString();

    const todayIndex = p.weight_history.findIndex(item => {
        const itemDate = new Date(item.created_at || item.date);
        const iy = itemDate.getFullYear();
        const im = String(itemDate.getMonth() + 1).padStart(2, '0');
        const id = String(itemDate.getDate()).padStart(2, '0');
        return `${iy}-${im}-${id}` === dateKey;
    });

    if (todayIndex > -1) {
        p.weight_history[todayIndex].peso_kg = weight;
        p.weight_history[todayIndex].created_at = timestamp;
    } else {
        p.weight_history.push({
            peso_kg: weight,
            created_at: timestamp
        });
    }

    p.weight_history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    renderEvolutionChart(p.weight_history);
}

function initEvolutionLogic() {
    const btnLog = document.getElementById('btnLogEvolution');
    if (btnLog) {
        btnLog.onclick = async () => {
            const p = AppState.patient;
            const nombre = document.getElementById('nombre')?.value;
            const peso = parseFloat(document.getElementById('peso')?.value) || 0;

            if (!nombre || peso <= 0) {
                showToast("⚠️ Ingresa nombre y peso para registrar");
                return;
            }

            btnLog.disabled = true;
            btnLog.innerText = "⏳ Registrando...";

            try {
                const metadata = {
                    is_evolution_point: true,
                    peso_ideal: p.peso_ideal || 0,
                    peso_ajustado: p.peso_ajustado || 0,
                    logged_at: new Date().toISOString()
                };

                const data = {
                    nombre: nombre,
                    peso_kg: peso,
                    user_id: AppState.user.id,
                    metadata: metadata,
                    estado_sala: 'activo'
                };

                const { error } = await supabaseClient.from('pacientes').insert([data]);
                if (error) throw error;

                showToast("📈 Punto de evolución registrado");
                updatePatientEvolutionChart(nombre);
            } catch (err) {
                console.error("Error logging evolution:", err);
                showToast("❌ Error al registrar punto");
            } finally {
                btnLog.disabled = false;
                btnLog.innerText = "Actualizar Gráfico con Peso";
            }
        };
    }
}


window.loadPatient = async (id) => {
    let data = null;
    try {
        const localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        data = localCache.find(p => p.id === id || p.cama === id || p.nombre === id);
    } catch(e) {}

    if (!data && supabaseClient) {
        const { data: dbData } = await supabaseClient.from('pacientes').select('*').eq('id', id).single();
        if (dbData) data = dbData;
    }

    if (data) {
        if (typeof resetPatientForm === 'function') {
            await resetPatientForm(true, true);
        }

        AppState.patient.id = data.id;
        AppState.patient.ia_report = data.ia_report || null;
        AppState.patient.metadata = JSON.parse(JSON.stringify(data.metadata || {}));

        if (data.metadata && data.metadata.patient_type) {
            const pType = data.metadata.patient_type;
            AppState.patient.type = pType;
            if (pType === 'adult') {
                const el = document.getElementById('ptAdult');
                if (el) el.checked = true;
            } else if (pType === 'pediatric') {
                const el = document.getElementById('ptPediatric');
                if (el) el.checked = true;
            } else if (pType === 'neonate') {
                const el = document.getElementById('ptNeonate');
                if (el) el.checked = true;
            }
            if (typeof window.updatePatientModeUI === 'function') {
                window.updatePatientModeUI(pType);
            }
        }

        if (data.metadata && data.metadata.weight_history) {
            AppState.patient.weight_history = data.metadata.weight_history;
        } else {
            AppState.patient.weight_history = [];
            if (data.peso_kg > 0) {
                AppState.patient.weight_history.push({
                    peso_kg: data.peso_kg,
                    created_at: data.created_at || new Date().toISOString()
                });
            }
        }
        if (typeof renderEvolutionChart === 'function') {
            renderEvolutionChart(AppState.patient.weight_history);
        }

        if (document.getElementById('nombre')) document.getElementById('nombre').value = data.nombre || '';
        if (document.getElementById('edad')) document.getElementById('edad').value = data.edad || 0;
        if (document.getElementById('peso')) document.getElementById('peso').value = data.peso_kg || 0;
        const { meters: hM } = window.parseSmartHeight(data.estatura_m || data.talla_cm);
        if (document.getElementById('estatura')) document.getElementById('estatura').value = hM > 0 ? hM.toString().replace('.', ',') : '';
        if (document.getElementById('sexo')) document.getElementById('sexo').value = data.sexo || 'm';
        if (document.getElementById('actividad')) document.getElementById('actividad').value = data.actividad || '1.2';
        if (document.getElementById('diagnostico')) document.getElementById('diagnostico').value = data.diagnostico || '';
        if (document.getElementById('cama')) document.getElementById('cama').value = data.cama || '';
        if (document.getElementById('num_ficha')) {
            document.getElementById('num_ficha').value = (data.metadata && data.metadata.num_ficha) || '';
        }
        if (document.getElementById('antecedentes_morbidos')) {
            document.getElementById('antecedentes_morbidos').value = (data.metadata && data.metadata.antecedentes_morbidos) || '';
        }
        if (document.getElementById('riesgo_lpp')) {
            document.getElementById('riesgo_lpp').value = (data.metadata && data.metadata.riesgo_lpp) || 'Sin evaluar';
        }
        if (document.getElementById('patologia_dm')) {
            document.getElementById('patologia_dm').checked = (data.metadata && data.metadata.patologia_dm) || false;
        }
        if (document.getElementById('patologia_hta')) {
            document.getElementById('patologia_hta').checked = (data.metadata && data.metadata.patologia_hta) || false;
        }
        if (document.getElementById('patologia_erc')) {
            document.getElementById('patologia_erc').checked = (data.metadata && data.metadata.patologia_erc) || false;
        }
        if (document.getElementById('fecha_ingreso_servicio')) {
            document.getElementById('fecha_ingreso_servicio').value = (data.metadata && data.metadata.fecha_ingreso_servicio) || '';
        }
        if (document.getElementById('observaciones_generales')) {
            document.getElementById('observaciones_generales').value = (data.metadata && data.metadata.observaciones_generales) || '';
        }
        if (document.getElementById('fechaNacimiento')) {
            document.getElementById('fechaNacimiento').value = (data.metadata && data.metadata.fecha_nacimiento) || '';
        }
        if (document.getElementById('evoExamenes')) {
            document.getElementById('evoExamenes').value = (data.metadata && data.metadata.evo_examenes) || '';
        }
        if (document.getElementById('evoTolerancia')) {
            document.getElementById('evoTolerancia').value = (data.metadata && data.metadata.evo_tolerancia) || '';
        }
        if (document.getElementById('diagnosticoPES')) {
            document.getElementById('diagnosticoPES').value = (data.metadata && (data.metadata.assessment?.pes || data.metadata.pes)) || '';
        }

        // Restore Anamnesis Symptoms & Gastro Signs
        if (data.metadata && data.metadata.anamnesis) {
            AppState.patient.anamnesis = JSON.parse(JSON.stringify(data.metadata.anamnesis));
            Object.entries(AppState.patient.anamnesis).forEach(([id, val]) => {
                if (typeof window.setToggleState === 'function') window.setToggleState(id, val);
            });
        }

        // Restore Anthropometric Assessment
        if (data.metadata && data.metadata.assessment) {
            const ass = data.metadata.assessment;
            if (ass.braquial && document.getElementById('cbraquial')) document.getElementById('cbraquial').value = ass.braquial;
            if (ass.cintura && document.getElementById('ccintura')) document.getElementById('ccintura').value = ass.cintura;
            if (ass.pantorrilla && document.getElementById('cpantorrilla')) document.getElementById('cpantorrilla').value = ass.pantorrilla;
            if (ass.atr && document.getElementById('altrodilla')) document.getElementById('altrodilla').value = ass.atr;
            if (ass.pliegues) {
                if (ass.pliegues.pt && document.getElementById('ptricipital')) document.getElementById('ptricipital').value = ass.pliegues.pt;
                if (ass.pliegues.pb && document.getElementById('pbicipital')) document.getElementById('pbicipital').value = ass.pliegues.pb;
                if (ass.pliegues.ps && document.getElementById('piliaco')) document.getElementById('piliaco').value = ass.pliegues.ps;
                if (ass.pliegues.pa && document.getElementById('pabdominal')) document.getElementById('pabdominal').value = ass.pliegues.pa;
            }
            if (ass.edema && document.getElementById('edemaGrade')) document.getElementById('edemaGrade').value = ass.edema;
        }

        // Restore Neonatal Fields
        if (data.metadata && data.metadata.neonatal) {
            const neo = data.metadata.neonatal;
            if (neo.eg_semanas && document.getElementById('egSemanas')) document.getElementById('egSemanas').value = neo.eg_semanas;
            if (neo.eg_dias && document.getElementById('egDias')) document.getElementById('egDias').value = neo.eg_dias;
            if (neo.peso_nacimiento && document.getElementById('pesoNacimiento')) document.getElementById('pesoNacimiento').value = neo.peso_nacimiento;
            if (neo.talla_nacimiento && document.getElementById('tallaNacimiento')) document.getElementById('tallaNacimiento').value = neo.talla_nacimiento;
            if (neo.pc_nacimiento && document.getElementById('pcNacimiento')) document.getElementById('pcNacimiento').value = neo.pc_nacimiento;
            if (neo.pcefalico && document.getElementById('pcefalico')) document.getElementById('pcefalico').value = neo.pcefalico;
        }

        // Restore Screening (NRS 2002 & STRONGkids)
        if (data.metadata && data.metadata.nrs2002) {
            AppState.patient.nrs2002 = JSON.parse(JSON.stringify(data.metadata.nrs2002));
            if (AppState.patient.nrs2002.initialAnswers) {
                Object.entries(AppState.patient.nrs2002.initialAnswers).forEach(([qId, val]) => {
                    if (typeof window.setNrsInitialState === 'function') window.setNrsInitialState(qId, val);
                });
            }
            if (typeof window.calculateNRS2002 === 'function') window.calculateNRS2002();
        }
        if (data.metadata && data.metadata.strongkids) {
            AppState.patient.strongkids = JSON.parse(JSON.stringify(data.metadata.strongkids));
            if (typeof window.calculateStrongKids === 'function') window.calculateStrongKids();
        }

        // Restore viaAlimentacionSelect if stored
        const viaSelect = document.getElementById('viaAlimentacionSelect');
        if (viaSelect) {
            viaSelect.value = data.metadata?.via_alimentacion || 'auto';
        }

        // Auto select Ingesta Oral diet from Dietools regimen metadata
        if (data.metadata && data.metadata.regimen) {
            const regText = data.metadata.regimen.toLowerCase().trim();
            const oralSelect = document.getElementById('oralDietType');
            if (oralSelect) {
                let matched = false;
                for (let i = 0; i < oralSelect.options.length; i++) {
                    const optText = oralSelect.options[i].text.toLowerCase();
                    const cleanOpt = optText.replace(/\s*\(\d+\s*kcal\)/i, '').trim();
                    const optVal = oralSelect.options[i].value.toLowerCase();
                    if (optVal !== 'custom' && (optText.includes(regText) || regText.includes(cleanOpt) || cleanOpt.includes(regText))) {
                        oralSelect.selectedIndex = i;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    if (regText.includes('hipoglucidica') || regText.includes('hpgl') || regText.includes('diabetico') || regText.includes('chandi')) oralSelect.value = 'papilla_diabetico';
                    else if (regText.includes('hiperproteica') || regText.includes('hpprt')) oralSelect.value = 'hyperproteico';
                    else if (regText.includes('papilla') && regText.includes('livian')) oralSelect.value = 'papilla_liviana';
                    else if (regText.includes('papilla')) oralSelect.value = 'papilla';
                    else if (regText.includes('hiposodica') || regText.includes('hpsd')) oralSelect.value = 'hiposodico';
                    else if (regText.includes('chanli') || regText.includes('liviana') || regText.includes('liv')) oralSelect.value = 'liviano';
                    else if (regText.includes('blanda') || regText.includes('sres') || regText.includes('sin residuo')) oralSelect.value = 'blando_sin_residuos';
                    else if (regText.includes('hipercalorica')) oralSelect.value = 'hypercalorico';
                    else if (regText.includes('hipocalorica')) oralSelect.value = 'hipocalorico';
                    else if (regText.includes('hipoproteica')) oralSelect.value = 'hipoproteico';
                    else if (regText.includes('cero') || regText.includes('regce') || regText.includes('ayuno')) oralSelect.value = 'cero';
                    else if (regText.includes('liquido') || regText.includes('liqfr')) oralSelect.value = 'liquido';
                    else if (regText.includes('comun') || regText.includes('normal')) oralSelect.value = 'comun';
                    else oralSelect.value = 'custom';
                }

                oralSelect.dispatchEvent(new Event('change'));
            }
        }

        // Restore stress factor before running calculations
        if (data.metadata && data.metadata.simulator && data.metadata.simulator.estres) {
            if (document.getElementById('estres')) {
                document.getElementById('estres').value = data.metadata.simulator.estres;
            }
        } else if (document.getElementById('estres')) {
            document.getElementById('estres').value = '1.0';
        }

        // Restore IA report if exists
        const resultBox = document.getElementById('iaResultContainer');
        const welcomeBox = document.getElementById('iaInitialState');
        if (data.ia_report && resultBox) {
            resultBox.style.display = 'block';
            resultBox.innerHTML = formatIAResponse(data.ia_report);
            if (welcomeBox) welcomeBox.style.display = 'none';
        } else if (resultBox) {
            resultBox.style.display = 'none';
            if (welcomeBox) welcomeBox.style.display = 'block';
        }

        // Trigger calc
        calculateRequirements();
        const histModal = document.getElementById('historyModal');
        if (histModal) histModal.classList.remove('active');

        // Restore goals if exist
        if (data.metadata && data.metadata.simulator) {
            const sim = data.metadata.simulator;
            // Clear current simulator inputs first
            const simInputs = ['formulaSelect', 'volume', 'dilution', 'modNessucar', 'modMCT', 'modEnterex', 'modBanatrol', 'modProteinex', 'modFresubin', 'oralKcal', 'oralProt', 'oralCHO', 'oralLip', 'oralWater', 'ivVolume'];
            simInputs.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
            if(document.getElementById('ivType')) document.getElementById('ivType').value = 'none';

            if (sim.macro_mode) {
                if (sim.macro_mode === 'pct') {
                    document.getElementById('btnModePct')?.click();
                } else {
                    document.getElementById('btnModeGkg')?.click();
                }
            }
            if (sim.goal_total) {
                const gtEl = document.getElementById('goalTotal');
                if (gtEl) gtEl.value = sim.goal_total;
            } else if (data.tmt) {
                const gtEl = document.getElementById('goalTotal');
                if (gtEl) gtEl.value = data.tmt;
            }
            if (sim.goal_prot) document.getElementById('goalProtKg').value = sim.goal_prot;
            if (sim.goal_cho) document.getElementById('goalCHOKg').value = sim.goal_cho;
            if (sim.goal_lip) document.getElementById('goalLipKg').value = sim.goal_lip;
            
            // Restore simulator values
            if (sim.formula) {
                document.getElementById('formulaSelect').value = sim.formula;
                const formulaObj = AppState.formulas.find(f => f.id === sim.formula);
                renderFormulaInputs(formulaObj);
            }
            if (sim.volume) document.getElementById('volume').value = sim.volume;
            if (sim.volume_times) document.getElementById('volumeTimes').value = sim.volume_times;
            if (sim.dilution) document.getElementById('dilution').value = sim.dilution;
            
            if (sim.modules) {
                Object.keys(sim.modules).forEach(m => {
                    const el = document.getElementById('mod' + m.charAt(0).toUpperCase() + m.slice(1));
                    if (el) el.value = sim.modules[m];
                });
            }
            if (sim.oral) {
                document.getElementById('oralKcal').value = sim.oral.kcal || '';
                document.getElementById('oralProt').value = sim.oral.prot || '';
                document.getElementById('oralCHO').value = sim.oral.cho || '';
                document.getElementById('oralLip').value = sim.oral.lip || '';
                document.getElementById('oralWater').value = sim.oral.water || '';
            }
            if (sim.iv) {
                document.getElementById('ivType').value = sim.iv.type || 'none';
                document.getElementById('ivVolume').value = sim.iv.volume || '';
            }

            if (typeof updateMacroGoals === 'function') updateMacroGoals();
            runSimulation(); 
        } else {
            // If no simulator metadata, clear inputs anyway
            const simInputs = ['formulaSelect', 'volume', 'dilution', 'modNessucar', 'modMCT', 'modEnterex', 'modBanatrol', 'modProteinex', 'modFresubin', 'oralKcal', 'oralProt', 'oralCHO', 'oralLip', 'oralWater', 'ivVolume'];
            simInputs.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
            if(document.getElementById('ivType')) document.getElementById('ivType').value = 'none';
            runSimulation();
        }

        document.getElementById('historyModal').classList.remove('active');

        // Update Chart for loaded patient (nuevo panel en cálculo)
        if (typeof updatePatientEvolutionChart === 'function') {
            updatePatientEvolutionChart(data.nombre);
        }
        
        if (typeof window.switchAppView === 'function') {
            window.switchAppView('dashboard');
        }
    }
};

window.updatePatientEvolutionChart = async (nombre) => {
    if (!nombre) return;
    
    const chartSection = document.getElementById('chartContainer');
    if (!chartSection) return;

    const p = AppState.patient;
    if (p && p.nombre && p.nombre.trim() === nombre.trim() && p.weight_history && p.weight_history.length > 0) {
        renderEvolutionChart(p.weight_history);
        const lbl = document.getElementById('lblChartPatientName');
        if (lbl) lbl.innerText = nombre;
        return;
    }

    if (!AppState.user || !AppState.user.id) {
        console.warn("updatePatientEvolutionChart: AppState.user not loaded.");
        return;
    }

    // Decoupled: Only fetch records that are explicitly evolution points
    const { data: records, error } = await supabaseClient
        .from('pacientes')
        .select('*, metadata')
        .eq('user_id', AppState.user.id)
        .eq('nombre', nombre)
        .neq('estado_sala', 'eliminado')
        .order('created_at', { ascending: false });

    // Filter by flag in metadata
    const evolutionPoints = (records || []).filter(r => r.metadata?.is_evolution_point === true);

    if (!error && evolutionPoints.length > 0) {
        const history = evolutionPoints.slice(0, 10).reverse();
        AppState.currentEvolutionHistory = history; // Store for real-time updates
        const lbl = document.getElementById('lblChartPatientName');
        if (lbl) lbl.innerText = nombre;
        renderEvolutionChart(history);
    } else {
        AppState.currentEvolutionHistory = [];
        const lbl = document.getElementById('lblChartPatientName');
        if (lbl) lbl.innerText = nombre || '--';
        renderEvolutionChart([]);
    }
};

// NEW V3.90: Phase 10 Amputee Engine
window.calcAmputations = () => {
    let factor = 0;
    const checks = document.querySelectorAll('.amp-check');
    if (!checks) return 0;
    checks.forEach(c => {
        if (c.checked) factor += parseFloat(c.value);
    });
    const el = document.getElementById('ampTotalVal');
    if (el) el.innerText = factor.toFixed(1);
    return factor;
};

function calculateRequirements() {
    const p = AppState.patient;
    const nombreEl = document.getElementById('nombre');
    const edadEl = document.getElementById('edad');
    const pesoEl = document.getElementById('peso');
    const estaturaEl = document.getElementById('estatura');
    const actividadEl = document.getElementById('actividad');
    const estresEl = document.getElementById('estres');
    const sexoEl = document.getElementById('sexo');

    if (!nombreEl || !edadEl || !pesoEl || !estaturaEl || !actividadEl || !sexoEl) return;

    p.nombre = nombreEl.value;
    p.edad = parseFloat(edadEl.value) || 0;
    p.peso = parseFloat(pesoEl.value) || 0;
    
    // Normalize height/estatura: if entered in cm (e.g. > 3), convert to meters
    const rawEst = parseFloat(estaturaEl.value) || 0;
    p.estatura = rawEst > 3 ? rawEst / 100 : rawEst;
    
    p.actividad = parseFloat(actividadEl.value) || 1.0;
    p.estres = parseFloat(estresEl?.value) || 1.0;
    p.sexo = sexoEl.value; // Store in AppState
    const sexo = p.sexo;

    p.type = document.querySelector('input[name="patientType"]:checked')?.value || 'adult';

    // Freshly calculate BMI so Z-scores use the updated value immediately
    if (p.peso > 0 && p.estatura > 0) {
        const ampFactor = window.calcAmputations ? window.calcAmputations() : 0;
        const bmiWeight = ampFactor > 0 ? (p.peso / ((100 - ampFactor) / 100)) : p.peso;
        p.bmi = bmiWeight / (p.estatura * p.estatura);
    }

    // Pediatric Z-Score Execution Engine
    renderPediatricZScores();

    // NEW V3.19/V3.90: Ideal Weight & IPT (Real-time) + Amputee Correction
    let rawPesoIdeal = 0;

    if (p.type === 'pediatric' || p.type === 'neonate') {
        const y = (p.evalParts || p.ageParts || {}).y || 0;
        let m = p.exactMonths || 0;
        const d = (p.evalParts || p.ageParts || {}).d || 0;
        const cm = p.estatura > 3 ? p.estatura : p.estatura * 100;

        const isUnderOne = (y === 0 && (m < 11 || (m === 11 && d <= 14)));
        let zWFH = null;
        if (cm > 0 && p.peso > 0) {
            zWFH = getZScore('wfh', cm, p.sexo, p.peso);
        }

        let methodText = "";
        if (p.type === 'neonate') {
            rawPesoIdeal = 0; // Do not calculate/show ideal weight for neonates
            methodText = "";
        } else if (y > 5 || (y === 5 && m >= 1)) {
            // Niños mayores > 5 años y Adolescentes: Mediana del IMC/E
            const medianBMI = getLMSMedian('bmi', m, p.sexo);
            if (medianBMI && p.estatura > 0) {
                rawPesoIdeal = medianBMI * (p.estatura * p.estatura);
            }
            methodText = "IMC/E";
        } else if (!isUnderOne || (isUnderOne && zWFH !== null && zWFH >= 1.0)) {
            // Excepción P/T: Preescolares (1-5) o lactantes con Sobrepeso/Obesidad (P/T >= 1)
            if (cm > 0) rawPesoIdeal = getLMSMedian('wfh', cm, p.sexo);
            methodText = "P/T";
        } else {
            // Lactantes regulares (< 1 año)
            rawPesoIdeal = getLMSMedian('wfa', m, p.sexo);
            methodText = "P/E";
        }

        const elTitle = document.getElementById('lblIdealWeightTitle');
        if (elTitle) elTitle.innerText = methodText ? `Peso Ideal (${methodText})` : "Peso Ideal";

        if (rawPesoIdeal) {
            document.getElementById('valIdealWeight').innerText = rawPesoIdeal.toFixed(1) + ' kg';
        } else {
            document.getElementById('valIdealWeight').innerText = '--';
        }

    } else if (p.estatura > 0 && p.edad > 0) {
        // Adult Logic
        const factorIdx = p.edad >= 65 ? 25.5 : 21.7;
        rawPesoIdeal = factorIdx * (p.estatura * p.estatura);
        document.getElementById('valIdealWeight').innerText = rawPesoIdeal.toFixed(1) + ' kg';
        const elTitle = document.getElementById('lblIdealWeightTitle');
        if (elTitle) elTitle.innerText = "Peso Ideal (Fórmula)";
    }

    if (rawPesoIdeal > 0) {
        let pesoIdeal = rawPesoIdeal;
        p.peso_ideal = pesoIdeal;

        // --- AMPUTEE OSTERKAMP CORRECTION ---
        const ampFactor = window.calcAmputations ? window.calcAmputations() : 0;
        const ampContainer = document.getElementById('ampWeightAdjContainer');
        const ampValDisplay = document.getElementById('ampWeightAdj');
        const ampEstContainer = document.getElementById('ampWeightEstContainer');
        const ampEstDisplay = document.getElementById('ampWeightEst');

        let pesoEstimado = p.peso;

        if (ampFactor > 0) {
            pesoIdeal = rawPesoIdeal * ((100 - ampFactor) / 100);
            if (ampContainer) ampContainer.style.display = 'block';
            if (ampValDisplay) ampValDisplay.innerText = pesoIdeal.toFixed(1) + ' kg';

            if (p.peso > 0) {
                pesoEstimado = p.peso / ((100 - ampFactor) / 100);
                if (ampEstContainer) ampEstContainer.style.display = 'block';
                if (ampEstDisplay) ampEstDisplay.innerText = pesoEstimado.toFixed(1) + ' kg';
                p.peso_estimado_preamp = pesoEstimado;
            } else {
                if (ampEstContainer) ampEstContainer.style.display = 'none';
                p.peso_estimado_preamp = 0;
            }
        } else {
            if (ampContainer) ampContainer.style.display = 'none';
            if (ampEstContainer) ampEstContainer.style.display = 'none';
            p.peso_estimado_preamp = 0;
        }

        if (p.peso > 0) {
            const ipt = (p.peso / pesoIdeal) * 100;
            const iptVal = ipt.toFixed(1);
            document.getElementById('valIPT').innerText = iptVal + '%';

            // NEW: Peso Ajustado para Obesos (IPT > 120%) -> Ahora permanente para Adultos
            const elPesoAjustado = document.getElementById('valPesoAjustado');
            if (elPesoAjustado) {
                if (p.type === 'adult') {
                    const adjW = pesoIdeal + 0.40 * (p.peso - pesoIdeal);
                    elPesoAjustado.innerText = adjW.toFixed(1) + ' kg';

                    if (ipt > 120) {
                        elPesoAjustado.style.color = '#c0392b'; // Warning rojo
                    } else {
                        elPesoAjustado.style.color = '#f39c12'; // Naranja normal
                    }
                    p.peso_ajustado = adjW;
                } else {
                    elPesoAjustado.innerText = "No aplica";
                    elPesoAjustado.style.color = '#888';
                }
            }

            // NEW: Superficie Corporal (Mosteller)
            const elSCT = document.getElementById('valSCT');
            if (elSCT && p.estatura > 0) {
                const sctVal = Math.sqrt((p.peso * (p.estatura * 100)) / 3600);
                elSCT.innerText = sctVal.toFixed(2) + ' mÂ²';
            }

            // IPT Classification Logic V3.22
            const iptClassEl = document.getElementById('valIPTClass');
            if (iptClassEl) {
                let status = "";
                const age = p.edad;

                if (age > 18) {
                    // Adults
                    if (ipt < 75) status = "Desnutrición Severa";
                    else if (ipt <= 84) status = "Desnutrición Moderada";
                    else if (ipt <= 89) status = "Desnutrición Leve";
                    else if (ipt <= 110) status = "Normal";
                    else status = "Sobrepeso/Obesidad";
                } else {
                    // Pediatrics / Adolescents (> 70% cutoff seems like Severe type III?)
                    // User criteria: 80-90 (Leve I), 70-79 (Mod II), <70 (Sev III)
                    if (ipt < 70) status = "Desnutrición Severa (G. III)";
                    else if (ipt <= 79) status = "Desnutrición Moderada (G. II)";
                    else if (ipt <= 90) status = "Desnutrición Leve (G. I)";
                    else if (ipt <= 110) status = "Normal";
                    else status = "Sobrepeso";
                }
                iptClassEl.innerText = status;
                iptClassEl.style.color = status.includes("Normal") ? "#27ae60" : "#c0392b";
            }
        }
    }

    const adultIMCContainer = document.getElementById('adultIMCContainer');
    const lblAdultIMC = document.getElementById('lblAdultIMC');
    const valAdultIMC = document.getElementById('valAdultIMC');
    const valIMCClass = document.getElementById('valIMCClass');

    if (p.type === 'adult') {
        if (adultIMCContainer) adultIMCContainer.style.display = 'block';
    } else {
        if (adultIMCContainer) adultIMCContainer.style.display = 'none';
    }

    if (p.peso > 0 && p.estatura > 0) {
        const ampFactor = window.calcAmputations ? window.calcAmputations() : 0;
        const bmiWeight = ampFactor > 0 ? (p.peso / ((100 - ampFactor) / 100)) : p.peso;
        p.bmi = bmiWeight / (p.estatura * p.estatura);
        
        const bmiEl = document.getElementById('valBMI');
        if (bmiEl) {
            bmiEl.innerText = p.bmi.toFixed(1);
            const parentSmall = bmiEl.parentNode;
            if (parentSmall) {
                if (ampFactor > 0) {
                    parentSmall.innerHTML = `IMC (Corr): <b id="valBMI">${p.bmi.toFixed(1)}</b>`;
                } else {
                    parentSmall.innerHTML = `IMC: <b id="valBMI">${p.bmi.toFixed(1)}</b>`;
                }
            }
        }

        if (p.type === 'adult' && valAdultIMC && valIMCClass) {
            valAdultIMC.innerText = p.bmi.toFixed(1) + ' kg/m²';
            if (lblAdultIMC) {
                lblAdultIMC.innerText = ampFactor > 0 ? 'IMC (Corregido)' : 'IMC';
            }

            let status = "";
            let color = "#27ae60";

            if (p.edad >= 65) {
                // Older Adult (EMPAM Chile)
                if (p.bmi < 23.0) {
                    status = "Bajo Peso (Desnutrido)";
                    color = "#c0392b";
                } else if (p.bmi < 28.0) {
                    status = "Normal (Eutrófico)";
                    color = "#27ae60";
                } else if (p.bmi < 32.0) {
                    status = "Sobrepeso";
                    color = "#f39c12";
                } else {
                    status = "Obesidad";
                    color = "#c0392b";
                }
            } else {
                // Adult (OMS)
                if (p.bmi < 18.5) {
                    status = "Bajo Peso (Desnutrido)";
                    color = "#c0392b";
                } else if (p.bmi < 25.0) {
                    status = "Normal (Eutrófico)";
                    color = "#27ae60";
                } else if (p.bmi < 30.0) {
                    status = "Sobrepeso";
                    color = "#f39c12";
                } else if (p.bmi < 35.0) {
                    status = "Obesidad Clase I";
                    color = "#c0392b";
                } else if (p.bmi < 40.0) {
                    status = "Obesidad Clase II";
                    color = "#c0392b";
                } else {
                    status = "Obesidad Clase III (Mórbida)";
                    color = "#8e44ad";
                }
            }

            p.diagWeight = status;
            valIMCClass.innerText = status;
            valIMCClass.style.color = color;
            if (p.type === 'adult' && status.includes("Obesidad")) {
                const sel = document.getElementById('pesoCalculoSelect');
                if (sel && sel.value === 'real') {
                    sel.value = 'ajustado';
                }
            }
        }
    } else {
        if (valAdultIMC) valAdultIMC.innerText = '--';
        if (valIMCClass) {
            valIMCClass.innerText = '--';
            valIMCClass.style.color = '#888';
        }
    }

    // Call waist evaluation for all patient types
    if (window.evaluateWaist) window.evaluateWaist();

    if (p.peso > 0 && p.edad > 0) {
        // --- Peso de Cálculo Metabólico ---
        let w = p.peso;
        const selCalculo = document.getElementById('pesoCalculoSelect')?.value;
        if (selCalculo === 'ideal' && p.peso_ideal > 0) {
            w = p.peso_ideal;
        } else if (selCalculo === 'ajustado' && p.peso_ajustado > 0) {
            w = p.peso_ajustado;
        } else if (selCalculo === 'estimated' && p.peso_estimado_preamp > 0) {
            w = p.peso_estimado_preamp;
        } else if (selCalculo === 'dry') {
            const edemaKg = parseFloat(document.getElementById('edemaGrade')?.value) || 0;
            const ascitisKg = parseFloat(document.getElementById('ascitesGrade')?.value) || 0;
            w = Math.max(0, p.peso - (edemaKg + ascitisKg));
        }
        p.peso_calculo = w; // Store to use in macronutrient goals globally

        // --- TMB (OMS/WHO) AUTOMATIC ---
        let bmr = 0;
        let method = document.getElementById('tmbMethod').value;
        const cm = p.estatura * 100;

        // FAO/OMS
        if (method === 'oms') {
            if (sexo === 'm') {
                if (p.edad < 3) bmr = (60.9 * w) - 54;
                else if (p.edad < 10) bmr = (22.7 * w) + 495;
                else if (p.edad < 18) bmr = (17.5 * w) + 651;
                else if (p.edad < 30) bmr = (15.3 * w) + 679;
                else if (p.edad < 60) bmr = (11.6 * w) + 879;
                else bmr = (13.5 * w) + 487;
            } else {
                if (p.edad < 3) bmr = (61.0 * w) - 51;
                else if (p.edad < 10) bmr = (22.5 * w) + 499;
                else if (p.edad < 18) bmr = (12.2 * w) + 746;
                else if (p.edad < 30) bmr = (14.7 * w) + 496;
                else if (p.edad < 60) bmr = (8.7 * w) + 829;
                else bmr = (10.5 * w) + 596;
            }
        }
        // Harris-Benedict (Original 1919 Clásica)
        else if (method === 'hb') {
            if (sexo === 'm') {
                bmr = 66.47 + (13.75 * w) + (5.0 * cm) - (6.75 * p.edad);
            } else {
                bmr = 655.09 + (9.56 * w) + (1.84 * cm) - (4.67 * p.edad);
            }
        }
        // Schofield (1985) - Consistently synced with calcTMB_OMS
        else if (method === 'schofield') {
            if (sexo === 'm') {
                if (p.edad < 3) bmr = 59.512 * w - 30.4;
                else if (p.edad < 10) bmr = 22.706 * w + 504.3;
                else if (p.edad < 18) bmr = 17.686 * w + 658.2;
                else if (p.edad < 30) bmr = 15.057 * w + 692.2;
                else if (p.edad < 60) bmr = 11.472 * w + 873.1;
                else bmr = 11.711 * w + 587.7;
            } else {
                if (p.edad < 3) bmr = 58.317 * w - 31.1;
                else if (p.edad < 10) bmr = 20.315 * w + 485.9;
                else if (p.edad < 18) bmr = 13.384 * w + 692.6;
                else if (p.edad < 30) bmr = 14.818 * w + 486.6;
                else if (p.edad < 60) bmr = 8.126 * w + 845.6;
                else bmr = 9.082 * w + 658.5;
            }
        }
        // Valencia (América Latina)
        else if (method === 'valencia') {
            if (sexo === 'm') {
                if (p.edad < 30) bmr = (13.37 * w) + 747;
                else if (p.edad < 60) bmr = (11.02 * w) + 679;
                else bmr = (10.92 * w) + 510;
            } else {
                if (p.edad < 30) bmr = (11.02 * w) + 679;
                else if (p.edad < 60) bmr = (10.92 * w) + 510;
                else bmr = (10.98 * w) + 520;
            }
        }
        // Roza y Shizgal (Harris-Benedict Revisada 1984)
        else if (method === 'rozashizgal') {
            if (sexo === 'm') {
                bmr = 88.362 + (13.397 * w) + (4.799 * cm) - (5.677 * p.edad);
            } else {
                bmr = 447.593 + (9.247 * w) + (3.098 * cm) - (4.330 * p.edad);
            }
        }
        // Owen (1986)
        else if (method === 'owen') {
            if (sexo === 'm') {
                bmr = 879 + (10.2 * w);
            } else {
                bmr = 795 + (7.18 * w);
            }
        }

        // Mifflin-St Jeor
        else if (method === 'msj') {
            if (sexo === 'm') {
                bmr = (10 * w) + (6.25 * cm) - (5 * p.edad) + 5;
            } else {
                bmr = (10 * w) + (6.25 * cm) - (5 * p.edad) - 161;
            }
        }

        const isQuemado = document.getElementById('chkQuemado')?.checked && p.peso > 0;
        const scqPercent = parseFloat(document.getElementById('scqPercent')?.value) || 0;
        let finalTMT = bmr * p.actividad * p.estres;
        let eqName = "(TMB";
        if (p.actividad !== 1.0) eqName += " Ã— FA";
        if (p.estres !== 1.0) eqName += " Ã— FE";
        eqName += ")";

        if (isQuemado && scqPercent > 0) {
            if (p.type === 'pediatric' || p.type === 'neonate') {
                // Galveston
                const sct = Math.sqrt((p.peso * cm) / 3600);
                const scqM2 = sct * (scqPercent / 100);
                document.getElementById('scqM2').value = scqM2.toFixed(2);
                finalTMT = (1800 * sct) + (2200 * scqM2);
                eqName = "Galveston (Quemados)";
                bmr = finalTMT / (p.actividad * p.estres); // Back-calculate display mock
            } else {
                // Curreri
                finalTMT = (25 * p.peso) + (40 * scqPercent);
                eqName = "Curreri (Quemados)";
                bmr = finalTMT / (p.actividad * p.estres);
            }
        }

        const resTMB = document.getElementById('resTMB');
        if (resTMB) resTMB.innerHTML = `${Math.round(finalTMT)} kcal <span style="font-size:0.6rem;">${eqName}</span>`;
        p.tmt_calculated = finalTMT;

        // Ensure factorial is also calculated
        calcFactorialNoRecursion();

        // Update Official GET Based on Selection
        window.updateSelectedGET();

        calcHydration();
        runSimulation();
    }
    
    // Re-render chart to reflect current point instantly
    if (typeof renderEvolutionChart === 'function') {
        renderEvolutionChart(AppState.currentEvolutionHistory || []);
    }

    // Auto-sync % Weight Loss Calculator
    const lossActualInput = document.getElementById('lossPesoActual');
    const lossHabitualInput = document.getElementById('lossPesoHabitual');
    const pesoAnteriorVal = parseFloat(document.getElementById('pesoAnterior')?.value) || 0;
    
    if (lossActualInput && p.peso > 0) {
        lossActualInput.value = p.peso;
    }
    if (lossHabitualInput && pesoAnteriorVal > 0 && !lossHabitualInput.value) {
        lossHabitualInput.value = pesoAnteriorVal;
    }
    if (typeof window.calculateWeightLoss === 'function') {
        window.calculateWeightLoss();
    }
}

function calcFactorialNoRecursion() {
    const p = AppState.patient;
    const fKcal = parseFloat(document.getElementById('factorKcal')?.value) || 25;
    const pesoCalculo = p.peso_calculo || p.peso;
    if (pesoCalculo > 0) {
        const factTotal = pesoCalculo * fKcal;
        p.factorial_calculated = factTotal;
        const resF = document.getElementById('resFactorial');
        if (resF) resF.innerText = `${Math.round(factTotal)} kcal`;
    }
}

window.setPatientTypeUI = function(mode) {
    const rAdult = document.getElementById('ptAdult');
    const rPed = document.getElementById('ptPediatric');
    const rNeo = document.getElementById('ptNeonate');
    
    if (mode === 'adult' && rAdult) {
        rAdult.checked = true;
    } else if (mode === 'pediatric' && rPed) {
        rPed.checked = true;
    } else if (mode === 'neonate' && rNeo) {
        rNeo.checked = true;
    }
    
    if (typeof window.updatePatientModeUI === 'function') {
        window.updatePatientModeUI(mode);
    }
};

window.syncPatientTypeSelector = function() {
    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) return;
    const activeLoc = JSON.parse(activeLocStr);
    const serviceType = activeLoc.type || 'adult'; 

    const lblAdult = document.getElementById('lblPtAdult');
    const lblPed = document.getElementById('lblPtPediatric');
    const lblNeo = document.getElementById('lblPtNeonate');

    if (lblAdult) lblAdult.style.display = serviceType === 'adult' ? 'inline-block' : 'none';
    if (lblPed) lblPed.style.display = serviceType === 'pediatric' ? 'inline-block' : 'none';
    if (lblNeo) lblNeo.style.display = serviceType === 'neonate' ? 'inline-block' : 'none';

    window.setPatientTypeUI(serviceType);
};

window.updateNoteStyle = function() {
    const fontSelect = document.getElementById('noteFontFamily');
    const sizeSelect = document.getElementById('noteFontSize');
    const noteEl = document.getElementById('noteContent');
    if (!noteEl) return;
    
    if (fontSelect) {
        noteEl.style.fontFamily = fontSelect.value;
        localStorage.setItem('notePrefFont', fontSelect.value);
    }
    if (sizeSelect) {
        noteEl.style.fontSize = sizeSelect.value;
        localStorage.setItem('notePrefSize', sizeSelect.value);
    }
};

window.updatePatientModeUI = (mode) => {
    const colEdad = document.getElementById('colEdad');
    if (colEdad) colEdad.style.display = mode === 'adult' ? 'block' : 'none';
    
    const colCintura = document.getElementById('colCintura');
    if (colCintura) colCintura.style.display = mode === 'neonate' ? 'none' : 'block';
    
    const colPcefalico = document.getElementById('colPcefalico');
    if (colPcefalico) colPcefalico.style.display = (mode === 'pediatric' || mode === 'neonate') ? 'block' : 'none';
    
    const rowPediatric = document.getElementById('rowPediatric');
    if (rowPediatric) rowPediatric.style.display = (mode === 'pediatric' || mode === 'neonate') ? 'flex' : 'none';
    
    const rowNeonate = document.getElementById('rowNeonate');
    if (rowNeonate) rowNeonate.style.display = mode === 'neonate' ? 'flex' : 'none';

    const fortPanel = document.getElementById('fortifierNeonatePanel');
    if (fortPanel) fortPanel.style.display = mode === 'neonate' ? 'block' : 'none';

    const rowSpec = document.getElementById('rowSpecialPopulations');
    if (rowSpec) rowSpec.style.display = mode === 'pediatric' ? 'flex' : 'none';

    // Hide edema panel drop button for Neonates
    const btnEdemaDrop = document.getElementById('btnEdemaDrop');
    const edemaPanel = document.getElementById('edemaPanel');
    if (btnEdemaDrop) {
        btnEdemaDrop.style.display = mode === 'neonate' ? 'none' : 'inline';
    }
    if (mode === 'neonate') {
        if (edemaPanel) edemaPanel.style.display = 'none';
        const edemaGrade = document.getElementById('edemaGrade');
        const ascitesGrade = document.getElementById('ascitesGrade');
        if (edemaGrade) edemaGrade.value = '0';
        if (ascitesGrade) ascitesGrade.value = '0';
        window.updateDryWeight();
    }

    // Show/hide and reset frequency inputs for pediatric / neonate
    const simVolumeRow = document.getElementById('simulationVolumeRow');
    const timesWrapper = document.getElementById('volumeTimesWrapper');
    const totalWrapper = document.getElementById('volumeTotalDisplayWrapper');
    const timesOp = document.getElementById('volumeTimesOperator');
    const totalOp = document.getElementById('volumeTotalOperator');
    if (simVolumeRow) {
        if (mode === 'pediatric' || mode === 'neonate') {
            simVolumeRow.classList.remove('adult-mode');
            simVolumeRow.classList.add('pediatric-mode');
            if (timesWrapper) timesWrapper.style.display = 'block';
            if (totalWrapper) totalWrapper.style.display = 'block';
            if (timesOp) timesOp.style.display = 'flex';
            if (totalOp) totalOp.style.display = 'flex';
        } else {
            simVolumeRow.classList.remove('pediatric-mode');
            simVolumeRow.classList.add('adult-mode');
            if (timesWrapper) timesWrapper.style.display = 'none';
            if (totalWrapper) totalWrapper.style.display = 'none';
            if (timesOp) timesOp.style.display = 'none';
            if (totalOp) totalOp.style.display = 'none';
            // Reset to 1 for adults to prevent calculation issues
            const timesInp = document.getElementById('volumeTimes');
            if (timesInp) timesInp.value = '1';
        }
    }
    window.updateVolumeTotal && window.updateVolumeTotal();

    document.getElementById('pediatricAssessmentResults').style.display = (mode === 'pediatric' || mode === 'neonate') ? 'block' : 'none';

    const iwRow = document.getElementById('valIdealWeight')?.parentElement?.parentElement;
    if (iwRow) iwRow.style.display = mode === 'neonate' ? 'none' : 'flex';

    const iptCard = document.getElementById('iptCardContainer');
    const sctCard = document.getElementById('sctCardContainer');
    const weightAdjCard = document.getElementById('weightAdjCardContainer');
    if (iptCard) iptCard.style.display = mode === 'neonate' ? 'none' : '';
    if (sctCard) sctCard.style.display = mode === 'neonate' ? 'none' : '';
    if (weightAdjCard) weightAdjCard.style.display = mode === 'neonate' ? 'none' : '';

    // Alternar visibilidad de tamizajes condicionales (STRONGkids vs NRS 2002)
    const strongKidsCard = document.getElementById('strongKidsCard');
    const nrs2002Card = document.getElementById('nrs2002Card');
    if (strongKidsCard) {
        strongKidsCard.style.display = (mode === 'pediatric' || mode === 'neonate') ? 'block' : 'none';
    }
    if (nrs2002Card) {
        nrs2002Card.style.display = mode === 'adult' ? 'block' : 'none';
        if (mode === 'adult' && typeof window.calculateNRS2002 === 'function') {
            window.calculateNRS2002();
        }
    }

    // Toggle growth curves and weight evolution visibility in Evaluación Completa
    const growthCurvesCard = document.getElementById('growthCurvesCard');
    const weightEvolutionCard = document.getElementById('weightEvolutionCard');
    if (growthCurvesCard) {
        growthCurvesCard.style.display = (mode === 'pediatric' || mode === 'neonate') ? 'block' : 'none';
    }
    if (weightEvolutionCard) {
        weightEvolutionCard.style.display = 'block';
    }

    calculateRequirements();
    if (typeof window.updateInfusionProposal === 'function') window.updateInfusionProposal();
    if (typeof window.updateCurveButtons === 'function') window.updateCurveButtons();
};

window.togglePatientMode = () => {
    const mode = document.querySelector('input[name="patientType"]:checked').value;
    clearAllInputsForMode(mode);
    window.updatePatientModeUI(mode);
};

window.toggleQuemado = () => {
    const chk = document.getElementById('chkQuemado');
    const panel = document.getElementById('quemadoPanel');
    const estresEl = document.getElementById('estres');

    if (chk && panel) {
        const isPeds = AppState.patient.type === 'pediatric' || AppState.patient.type === 'neonate';
        const protInput = document.getElementById('goalProtKg');

        if (chk.checked) {
            panel.style.display = 'block';
            if (estresEl && parseFloat(estresEl.value) < 1.5) {
                estresEl.value = "1.5"; // Auto set stress to minimum burn multiplier
            }
            if (protInput && typeof macroGoalMode !== 'undefined' && macroGoalMode === 'gkg') {
                protInput.placeholder = isPeds ? "Ej. 2.5 - 3.0" : "Ej. 1.5 - 2.5";
            }
        } else {
            panel.style.display = 'none';
            if (protInput && typeof macroGoalMode !== 'undefined' && macroGoalMode === 'gkg') {
                protInput.placeholder = "Ej. 1.5";
            }
        }
    }
    calculateRequirements();
};

window.calculatePediatricAge = () => {
    const fn = document.getElementById('fechaNacimiento').value;
    const birth = parseSpanishDate(fn);
    if (!birth) {
        // If birth date is not entered or invalid, hide panels
        const panelPeds = document.getElementById('pedsPrematurityPanel');
        if (panelPeds) panelPeds.style.display = 'none';
        const panelNeo = document.getElementById('neonateCorrectedAgePanel');
        if (panelNeo) panelNeo.style.display = 'none';
        return;
    }

    const now = new Date();

    // Clear hours to ensure exact day differences
    now.setHours(0,0,0,0);

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const totalMonths = (years * 12) + months;
    let ageInYears = (totalMonths + (days / 30.4375)) / 12;
    document.getElementById('edad').value = ageInYears.toFixed(2);

    let ageStr = "";
    if (years > 0) ageStr += `${years} año${years > 1 ? 's' : ''}, `;
    if (months > 0 || years > 0) ageStr += `${months} mes${months !== 1 ? 'es' : ''}, `;
    ageStr += `${days} día${days !== 1 ? 's' : ''}`;

    const d = String(birth.getDate()).padStart(2, '0');
    const mm = String(birth.getMonth() + 1).padStart(2, '0');
    const y = birth.getFullYear();
    const formattedDate = `${d}/${mm}/${y}`;
    
    if (AppState.patient.type === 'neonate') {
        const semNac = parseInt(document.getElementById('egSemanas').value) || 0;
        const diasNac = parseInt(document.getElementById('egDias').value) || 0;
        const totalDaysChrono = Math.floor(Math.abs(now - birth) / (1000 * 60 * 60 * 24));
        const totalDays = (semNac * 7) + diasNac + totalDaysChrono;
        const semCorr = Math.floor(totalDays / 7);
        const diasCorr = totalDays % 7;
        ageStr += ` | <span style="color:#e74c3c; font-weight:700;">EG Corregida: ${semCorr} sem + ${diasCorr} d</span>`;
    }
    
    document.getElementById('lblExactAge').innerHTML = `<span style="font-weight:700; color:#2c3e50;">F. Nacimiento: ${formattedDate}</span> | ${ageStr}`;

    let evalMonths = totalMonths;
    let evalY = years;
    let evalM = months;
    if (days >= 16) {
        evalMonths += 1;
        evalM += 1;
        if (evalM >= 12) {
            evalY += 1;
            evalM -= 12;
        }
    }

    AppState.patient.exactMonths = evalMonths;
    AppState.patient.ageParts = { y: years, m: months, d: days };
    AppState.patient.evalParts = { y: evalY, m: evalM, d: days };

    // Calculate Corrected Age
    const isPeds = AppState.patient.type === 'pediatric';
    const isNeo = AppState.patient.type === 'neonate';
    
    // Chronological days calculation
    const totalDaysChrono = Math.floor(Math.abs(now - birth) / (1000 * 60 * 60 * 24));

    // Show/Hide prematurity panel in pediatric mode based on chronological age (< 2 years)
    const pedsPrematurityPanel = document.getElementById('pedsPrematurityPanel');
    if (pedsPrematurityPanel) {
        pedsPrematurityPanel.style.display = (isPeds && totalMonths < 24) ? 'block' : 'none';
    }

    if (isPeds && totalMonths < 24) {
        const semNacer = parseInt(document.getElementById('egSemanasPeds')?.value) || 0;
        const diasNacer = parseInt(document.getElementById('egDiasPeds')?.value) || 0;
        const displayEl = document.getElementById('lblCorrectedAgeDisplay');

        if (semNacer > 0 && semNacer < 37) {
            // Premature baby!
            const prematurityDays = (40 * 7) - (semNacer * 7 + diasNacer);
            const correctedDays = totalDaysChrono - prematurityDays;

            if (correctedDays < 0) {
                if (displayEl) {
                    displayEl.innerHTML = `⚠️ No ha alcanzado la Fecha Probable de Parto (FPP: ${Math.abs(correctedDays)} días restantes)`;
                }
                AppState.patient.exactMonthsCorr = 0;
                AppState.patient.agePartsCorr = { y: 0, m: 0, d: 0 };
                AppState.patient.evalPartsCorr = { y: 0, m: 0, d: 0 };
            } else {
                const corrY = Math.floor(correctedDays / 365.25);
                const remainingDays = correctedDays % 365.25;
                const corrM = Math.floor(remainingDays / 30.4375);
                const corrD = Math.round(remainingDays % 30.4375);

                let corrStr = "Edad Corregida: ";
                if (corrY > 0) corrStr += `${corrY} año${corrY > 1 ? 's' : ''}, `;
                if (corrM > 0 || corrY > 0) corrStr += `${corrM} mes${corrM !== 1 ? 'es' : ''}, `;
                corrStr += `${corrD} día${corrD !== 1 ? 's' : ''}`;

                if (displayEl) displayEl.innerText = corrStr;

                let evalMonthsCorr = (corrY * 12) + corrM;
                let corrEvalY = corrY;
                let corrEvalM = corrM;
                if (corrD >= 16) {
                    evalMonthsCorr += 1;
                    corrEvalM += 1;
                    if (corrEvalM >= 12) {
                        corrEvalY += 1;
                        corrEvalM -= 12;
                    }
                }

                AppState.patient.exactMonthsCorr = evalMonthsCorr;
                AppState.patient.agePartsCorr = { y: corrY, m: corrM, d: corrD };
                AppState.patient.evalPartsCorr = { y: corrEvalY, m: corrEvalM, d: corrD };
            }
        } else {
            if (displayEl) displayEl.innerText = "Edad Corregida: -- (No prematuro / No ingresado)";
            delete AppState.patient.exactMonthsCorr;
            delete AppState.patient.agePartsCorr;
            delete AppState.patient.evalPartsCorr;
        }
    } else {
        delete AppState.patient.exactMonthsCorr;
        delete AppState.patient.agePartsCorr;
        delete AppState.patient.evalPartsCorr;
    }

    // Neonatal Corrected Age calculations
    const neonateAgePanel = document.getElementById('neonateCorrectedAgePanel');
    if (neonateAgePanel) {
        neonateAgePanel.style.display = isNeo ? 'flex' : 'none';
    }

    if (isNeo) {
        const semNacer = parseInt(document.getElementById('egSemanas')?.value) || 0;
        const diasNacer = parseInt(document.getElementById('egDias')?.value) || 0;

        const lblChrono = document.getElementById('lblNeonateChronologicalAge');
        const lblCorrGest = document.getElementById('lblNeonateCorrectedGestation');
        const lblCorrPost = document.getElementById('lblNeonateCorrectedPostnatal');

        if (lblChrono) {
            lblChrono.innerText = `Edad Cronológica Postnatal: ${totalDaysChrono} días (${Math.floor(totalDaysChrono / 7)} sem, ${totalDaysChrono % 7} días)`;
        }

        if (semNacer > 0) {
            // Corrected Gestational Age: EG al nacer + chronological age
            const totalDaysGestNacer = (semNacer * 7) + diasNacer;
            const totalDaysGestCorr = totalDaysGestNacer + totalDaysChrono;
            const semGestCorr = Math.floor(totalDaysGestCorr / 7);
            const diasGestCorr = totalDaysGestCorr % 7;

            if (lblCorrGest) {
                lblCorrGest.innerText = `Edad Gestacional Corregida: ${semGestCorr} semanas + ${diasGestCorr} días`;
            }

            // Corrected Postnatal Age: chronological age - prematurity days
            const prematurityDays = (40 * 7) - totalDaysGestNacer;
            const correctedDaysPost = totalDaysChrono - prematurityDays;

            if (lblCorrPost) {
                if (correctedDaysPost < 0) {
                    lblCorrPost.innerText = `Edad Postnatal Corregida: -${Math.abs(correctedDaysPost)} días (Faltan ${Math.abs(correctedDaysPost)} días para término)`;
                } else {
                    const corrPostSem = Math.floor(correctedDaysPost / 7);
                    const corrPostDias = correctedDaysPost % 7;
                    lblCorrPost.innerText = `Edad Postnatal Corregida: ${corrPostSem} semanas + ${corrPostDias} días`;
                }
            }
        } else {
            if (lblCorrGest) lblCorrGest.innerText = `Edad Gestacional Corregida: -- (Falta EG al nacer)`;
            if (lblCorrPost) lblCorrPost.innerText = `Edad Postnatal Corregida: -- (Falta EG al nacer)`;
        }
    }

    calculateRequirements();
    if (typeof window.calculateNRS2002 === 'function') {
        window.calculateNRS2002();
    }
};

function getLMSMedian(indicator, keyVal, sexo) {
    const specCond = document.getElementById('specialCondition')?.value || 'none';
    const sexKey = sexo === 'm' ? 'boys' : 'girls';

    let table = null;
    let isInterpolated = false;

    if (specCond === 'down' && window.ZEMEL_DATA && window.ZEMEL_DATA[indicator]) {
        table = window.ZEMEL_DATA[indicator][sexKey];
        isInterpolated = true;
    } else if (specCond.startsWith('cp_') && window.BROOKS_DATA) {
        let cpGroup = 'gmfcs_1_2';
        if (specCond === 'cp_iii_iv') cpGroup = 'gmfcs_3_4';
        else if (specCond === 'cp_v') cpGroup = 'gmfcs_5';

        if (window.BROOKS_DATA[cpGroup] && window.BROOKS_DATA[cpGroup][indicator]) {
            table = window.BROOKS_DATA[cpGroup][indicator][sexKey];
            isInterpolated = true;
        }
    }

    if (!table && indicator === 'hc' && window.NEURO_HC_DATA && window.NEURO_HC_DATA.hc) {
        table = window.NEURO_HC_DATA.hc[sexKey];
        isInterpolated = true;
    }

    if (!table) {
        if (!window.MINSAL_DATA || !window.MINSAL_DATA[indicator]) return null;
        table = window.MINSAL_DATA[indicator][sexKey];
        isInterpolated = false;
    }

    if (!table || table.length === 0) return null;

    let L, M, S;

    if (isInterpolated) {
        let lower = table[0];
        let upper = table[table.length - 1];

        if (keyVal <= lower[0]) {
            [_, L, M, S] = lower;
        } else if (keyVal >= upper[0]) {
            [_, L, M, S] = upper;
        } else {
            for (let i = 0; i < table.length - 1; i++) {
                if (keyVal >= table[i][0] && keyVal <= table[i + 1][0]) {
                    lower = table[i];
                    upper = table[i + 1];
                    break;
                }
            }
            if (lower[0] === upper[0]) {
                [_, L, M, S] = lower;
            } else {
                const ratio = (keyVal - lower[0]) / (upper[0] - lower[0]);
                M = lower[2] + ratio * (upper[2] - lower[2]);
            }
        }
    } else {
        let closest = table[0];
        let minDiff = 9999;
        for (let r of table) {
            const diff = Math.abs(r.k - keyVal);
            if (diff < minDiff) {
                minDiff = diff;
                closest = r;
            }
        }
        M = closest.M;
    }

    return M;
}

function getZScore(indicator, keyVal, sexo, obs) {
    if (!obs) return null;
    const specCond = document.getElementById('specialCondition')?.value || 'none';
    const sexKey = sexo === 'm' ? 'boys' : 'girls';

    let table = null;
    let isInterpolated = false;

    if (specCond === 'down' && window.ZEMEL_DATA && window.ZEMEL_DATA[indicator]) {
        table = window.ZEMEL_DATA[indicator][sexKey];
        isInterpolated = true;
    } else if (specCond.startsWith('cp_') && window.BROOKS_DATA) {
        let cpGroup = 'gmfcs_1_2';
        if (specCond === 'cp_iii_iv') cpGroup = 'gmfcs_3_4';
        else if (specCond === 'cp_v') cpGroup = 'gmfcs_5';

        if (window.BROOKS_DATA[cpGroup] && window.BROOKS_DATA[cpGroup][indicator]) {
            table = window.BROOKS_DATA[cpGroup][indicator][sexKey];
            isInterpolated = true;
        }
    }

    // NEW V3.95: Special fallback for Head Circumference (HC) WHO Data
    if (!table && indicator === 'hc' && window.NEURO_HC_DATA && window.NEURO_HC_DATA.hc) {
        table = window.NEURO_HC_DATA.hc[sexKey];
        isInterpolated = true;
    }

    // Fallback a MINSAL si no hay tabla (Ej. pidiendo Talla en Brooks si no la configuramos)
    if (!table) {
        if (!window.MINSAL_DATA || !window.MINSAL_DATA[indicator]) return null;
        table = window.MINSAL_DATA[indicator][sexKey];
        isInterpolated = false; // MINSAL usa {k, L, M, S} estructurado por mes
    }

    if (!table || table.length === 0) return null;

    let L, M, S;

    if (isInterpolated) {
        // Interpolación Algebraica para bases de datos dispersas (Hitos)
        let lower = table[0];
        let upper = table[table.length - 1];

        if (keyVal <= lower[0]) {
            [_, L, M, S] = lower;
        } else if (keyVal >= upper[0]) {
            [_, L, M, S] = upper;
        } else {
            for (let i = 0; i < table.length - 1; i++) {
                if (keyVal >= table[i][0] && keyVal <= table[i + 1][0]) {
                    lower = table[i];
                    upper = table[i + 1];
                    break;
                }
            }
            if (lower[0] === upper[0]) {
                [_, L, M, S] = lower;
            } else {
                const ratio = (keyVal - lower[0]) / (upper[0] - lower[0]);
                L = lower[1] + ratio * (upper[1] - lower[1]);
                M = lower[2] + ratio * (upper[2] - lower[2]);
                S = lower[3] + ratio * (upper[3] - lower[3]);
            }
        }
    } else {
        // Búsqueda de hito más cercano para MINSAL (base densa)
        let closest = table[0];
        let minDiff = 9999;
        for (let r of table) {
            const diff = Math.abs(r.k - keyVal);
            if (diff < minDiff) {
                minDiff = diff;
                closest = r;
            }
        }
        L = closest.L;
        M = closest.M;
        S = closest.S;
    }

    if (L === 0) return Math.log(obs / M) / S;
    return (Math.pow(obs / M, L) - 1) / (L * S);
}

function renderPediatricZScores() {
    const p = AppState.patient;
    const grid = document.getElementById('zscoreGrid');
    if (!grid || !p) return;

    if (p.type !== 'pediatric' && p.type !== 'neonate') return;

    const useCorrected = document.getElementById('chkUseCorrectedAge')?.checked;
    let m = (useCorrected && p.exactMonthsCorr !== undefined && p.type === 'pediatric') ? p.exactMonthsCorr : (p.exactMonths || 0);
    if (m < 0) m = 0;

    const cm = p.estatura > 3 ? p.estatura : p.estatura * 100;

    let zWFA = getZScore('wfa', m, p.sexo, p.peso);
    let zHFA = getZScore('hfa', m, p.sexo, cm);
    let zBMI = getZScore('bmi', m, p.sexo, p.bmi);
    let zWFH = getZScore('wfh', cm, p.sexo, p.peso);
    p.zScores = { wfa: zWFA, hfa: zHFA, bmi: zBMI, wfh: zWFH };

    let html = '';

    const specCond = document.getElementById('specialCondition')?.value || 'none';
    if (useCorrected && p.exactMonthsCorr !== undefined && p.type === 'pediatric') {
        html += `<div style="grid-column:1/-1; background:rgba(142,68,173,0.1); padding:6px; border-radius:6px; margin-bottom:6px; color:#8e44ad; font-size:0.65rem; text-align:center; font-weight:700; border:1px solid rgba(142,68,173,0.2);">👶 Evaluación: Utilizando Edad Corregida para cálculo de Z-Scores (Prematuro).</div>`;
    }

    if (specCond === 'down') {
        html += `<div style="grid-column:1/-1; background:rgba(211,84,0,0.1); padding:4px; border-radius:4px; margin-bottom:4px; color:#d35400; font-size:0.65rem; text-align:center;">📊 <b>Zemel (S. Down):</b> Evaluando curvas LMS vía Interpolación Geométrica (Hitos).</div>`;
    } else if (specCond.startsWith('cp_')) {
        html += `<div style="grid-column:1/-1; background:rgba(142,68,173,0.1); padding:4px; border-radius:4px; margin-bottom:4px; color:#8e44ad; font-size:0.65rem; text-align:center;">📊 <b>Brooks (Parálisis Cerebral):</b> Evaluando curvas GMFCS vía Interpolación Geométrica.</div>`;
    }

    const makeBadge = (title, z, textOverride = null, colorOverride = null) => {
        let color = colorOverride || '#27ae60';
        let diag = 'N';
        let displayVal = textOverride;

        if (textOverride === null) {
            if (z === null || isNaN(z)) return '';

            // Adjusting to match printed MINSAL tables rounding with a clinical tolerance of 0.06
            if (title.includes('IMC') && z >= 2.94) { color = '#8e44ad'; diag = '+3 DE'; }
            else if (z >= 1.94) { color = '#c0392b'; diag = '+2 DE'; } // MINSAL Obesidad is >= +2
            else if (z >= 0.94) { color = '#f39c12'; diag = '+1 DE'; } // MINSAL Sobrepeso is >= +1
            else if (z <= -1.94) { color = '#c0392b'; diag = '-2 DE'; }
            else if (z <= -0.94) { color = '#e67e22'; diag = '-1 DE'; }

            displayVal = `${z > 0 ? '+' : ''}${z.toFixed(2)}`;
        } else {
            diag = ''; // No special symbol for string-based badges
        }

        const diagHtml = diag ? `<span style="font-size:0.55rem; padding:2px 3px; background:${color}20; border-radius:4px; font-weight:700;">${diag}</span>` : '';
        let badgeIdAttr = '';
        if (title.includes('IMC/E') || title.includes('P/T')) badgeIdAttr = ' id="valZBMI"';
        else if (title.includes('T/E') || title.includes('Talla/Edad')) badgeIdAttr = ' id="valZHFA"';
        return `<div${badgeIdAttr} style="background:#fff; border:1px solid ${color}; padding:5px; border-radius:6px; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
            <div style="font-size:0.55rem; color:#666; font-weight:600; line-height:1.1;">${title}</div>
            <div style="font-size:0.85rem; font-weight:800; color:${color}; display:flex; justify-content:center; align-items:baseline; gap:4px; margin-top:2px;">
                ${displayVal}
                ${diagHtml}
            </div>
        </div>`;
    };

    let ccBadge = window.evaluateWaist ? window.evaluateWaist(makeBadge) : '';

    if (p.type === 'neonate') {
        const semNac = parseInt(document.getElementById('egSemanas').value) || 0;
        const diasNac = parseInt(document.getElementById('egDias').value) || 0;
        
        let agePostnatalDays = 0;
        const fn = document.getElementById('fechaNacimiento').value;
        const birth = parseSpanishDate(fn);
        if (birth) {
            const now = new Date();
            now.setHours(0,0,0,0);
            agePostnatalDays = Math.floor(Math.abs(now - birth) / (1000 * 60 * 60 * 24));
        }
        
        const totalDays = (semNac * 7) + diasNac + agePostnatalDays;
        let sem = Math.floor(totalDays / 7);
        if (sem < 24) sem = 24;
        if (sem > 42) sem = 42;
        
        const wGrams = p.peso * 1000;
        const cm = p.estatura > 3 ? p.estatura : p.estatura * 100;

        let clasD = 'Sin Datos';
        let clasColor = '#95a5a6';
        let ipDiag = null;
        let isPeg = false;

        let clasTalla = 'Sin Datos';
        let clasTallaColor = '#95a5a6';
        let clasPC = 'Sin Datos';
        let clasPCColor = '#95a5a6';
        const pcInput = parseFloat(document.getElementById('pcefalico')?.value) || 0;

        if (sem >= 24 && sem <= 42 && window.PITTALUGA_DATA) {
            // Peso / EG
            if (p.peso > 0) {
                const wRefs = window.PITTALUGA_DATA.peso[sem];
                if (wRefs) {
                    if (wGrams < wRefs.p3) {
                        clasD = 'PEG Severo'; clasColor = '#c0392b'; isPeg = true;
                    } else if (wGrams >= wRefs.p3 && wGrams < wRefs.p10) {
                        clasD = 'PEG Leve'; clasColor = '#e67e22'; isPeg = true;
                    } else if (wGrams >= wRefs.p10 && wGrams <= wRefs.p90) {
                        clasD = 'AEG'; clasColor = '#27ae60';
                    } else {
                        clasD = 'GEG'; clasColor = '#2980b9';
                    }
                }
            } else {
                clasD = 'Falta Peso';
            }

            // Talla / EG
            if (cm > 0 && window.PITTALUGA_DATA.talla) {
                const tRefs = window.PITTALUGA_DATA.talla[sem];
                if (tRefs) {
                    if (cm < tRefs.p10) {
                        clasTalla = 'Talla Corta / EG'; clasTallaColor = '#c0392b';
                    } else if (cm >= tRefs.p10 && cm <= tRefs.p90) {
                        clasTalla = 'Talla Adecuada'; clasTallaColor = '#27ae60';
                    } else {
                        clasTalla = 'Talla Alta / EG'; clasTallaColor = '#2980b9';
                    }
                }
            } else {
                clasTalla = 'Falta Talla';
            }

            // PC / EG
            if (pcInput > 0 && window.PITTALUGA_DATA.pc) {
                const pcRefs = window.PITTALUGA_DATA.pc[sem];
                if (pcRefs) {
                    if (pcInput < pcRefs.p10) {
                        clasPC = 'PC Bajo (Sosp. Microcefalia)'; clasPCColor = '#c0392b';
                    } else if (pcInput >= pcRefs.p10 && pcInput <= pcRefs.p90) {
                        clasPC = 'PC Adecuado'; clasPCColor = '#27ae60';
                    } else {
                        clasPC = 'PC Alto (Sosp. Macrocefalia)'; clasPCColor = '#c0392b';
                    }
                }
            } else {
                clasPC = 'Falta PC';
            }

            // Simetría (Índice Ponderal)
            if (isPeg && p.peso > 0 && cm > 0) {
                const ipVal = (wGrams / Math.pow(cm, 3)) * 100;

                if (ipVal >= 2.2) {
                    ipDiag = `Simétrico (IP: ${ipVal.toFixed(2)})`;
                    clasColor = '#f39c12';
                } else if (ipVal >= 2.0) {
                    ipDiag = `Asimétrico Leve (IP: ${ipVal.toFixed(2)})`;
                    clasColor = '#d35400';
                } else {
                    ipDiag = `Asimétrico Severo (IP: ${ipVal.toFixed(2)}) ⚠️ Riesgo Hipoglicemia`;
                    clasColor = '#c0392b';
                }
            } else if (isPeg) {
                ipDiag = 'Falta Talla para IP';
            }
        } else if (sem > 0) {
            clasD = '< 24 sem';
            clasTalla = '< 24 sem';
            clasPC = '< 24 sem';
        }

        let printClas = clasD;
        if (ipDiag !== null) {
            printClas = `<div style="line-height:1.2;"><b>${clasD}</b><br><span style="font-size:0.6rem; color:#fff; background:rgba(0,0,0,0.2); padding:2px 4px; border-radius:4px;">${ipDiag}</span></div>`;
        }
        html += makeBadge('Peso / EG (Pittaluga)', null, printClas, clasColor);

        if (cm > 0) {
            html += makeBadge('Talla / EG (Pittaluga)', null, clasTalla, clasTallaColor);
        }
        if (pcInput > 0) {
            html += makeBadge('PC / EG (Pittaluga)', null, clasPC, clasPCColor);
        }

        if (sem > 0 && sem < 37) {
            const fn = document.getElementById('fechaNacimiento').value;
            const birthDate = parseSpanishDate(fn);
            if (birthDate) {
                const now = new Date();

                const diffTime = now.getTime() - birthDate.getTime();
                const chronDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

                const gestDays = (semNac * 7) + diasNac;
                const missingDays = 280 - gestDays;

                let correctedDays = chronDays - missingDays;
                if (correctedDays < 0) correctedDays = 0;

                let corrString = '';
                if (correctedDays < 30) {
                    const cWeeks = Math.floor(correctedDays / 7);
                    const cDays = correctedDays % 7;
                    corrString = `${cWeeks} sem, ${cDays}d`;
                } else if (correctedDays < 349.8) {
                    const cMonths = Math.floor(correctedDays / 30.4375);
                    const cDays = Math.floor(correctedDays % 30.4375);
                    corrString = `${cMonths}m, ${cDays}d`;
                } else {
                    let d = correctedDays;
                    if (d >= 349.8 && d < 365.25) d = 365.25;

                    const cYears = Math.floor(d / 365.25);
                    const r = d % 365.25;
                    const cMonths = Math.floor(r / 30.4375);
                    const finalDays = Math.floor(r % 30.4375);

                    if (cMonths === 0) {
                        corrString = `${cYears} Año${finalDays > 0 ? `, ${finalDays}d` : ''}`;
                    } else {
                        corrString = `${cYears} Año, ${cMonths}m, ${finalDays}d`;
                    }
                }

                html += makeBadge('Edad Correg.', null, corrString, '#2980b9');
            } else {
                html += makeBadge('Edad Correg.', null, 'Falta Fecha', '#95a5a6');
            }
        } else if (sem >= 37) {
            html += makeBadge('Condición', null, 'Término', '#2980b9');
        }
    } else {
        const parts = (useCorrected && p.exactMonthsCorr !== undefined && p.type === 'pediatric') ? (p.agePartsCorr || { y: 0, m: 0, d: 0 }) : (p.ageParts || { y: 0, m: 0, d: 0 });
        const y = parts.y;
        const mt = parts.m;
        const d = parts.d;

        const isUnderOne = (y === 0 && (mt < 11 || (mt === 11 && d <= 14)));
        const isOneToFive = !isUnderOne && (y < 5 || (y === 5 && mt === 0 && d <= 29));

        let diagWeight = '';
        let diagWColor = '#888';

        let evaluatedBy = '';
        if (isUnderOne) {
            const zPT = (zWFH !== null && !isNaN(zWFH)) ? zWFH : null;
            if (zPT !== null && zPT >= 0.94) {
                evaluatedBy = ' [Evaluado por P/T]';
                if (zPT >= 1.94) { diagWeight = 'Obesidad'; diagWColor = '#c0392b'; }
                else { diagWeight = 'Sobrepeso'; diagWColor = '#f39c12'; }
            } else {
                evaluatedBy = ' [Evaluado por P/E]';
                if (zWFA <= -1.94) { diagWeight = 'Desnutrición'; diagWColor = '#c0392b'; }
                else if (zWFA <= -0.94) { diagWeight = 'Riesgo de Desnutrir'; diagWColor = '#e67e22'; }
                else { diagWeight = 'Normal o Eutrófico'; diagWColor = '#27ae60'; }
            }
        } else if (isOneToFive) {
            evaluatedBy = ' [Evaluado por P/T]';
            if (zWFH <= -1.94) { diagWeight = 'Desnutrición'; diagWColor = '#c0392b'; }
            else if (zWFH <= -0.94) { diagWeight = 'Riesgo de Desnutrir'; diagWColor = '#e67e22'; }
            else if (zWFH >= 1.94) { diagWeight = 'Obesidad'; diagWColor = '#c0392b'; }
            else if (zWFH >= 0.94) { diagWeight = 'Sobrepeso'; diagWColor = '#f39c12'; }
            else { diagWeight = 'Normal o Eutrófico'; diagWColor = '#27ae60'; }
        } else {
            evaluatedBy = ' [Evaluado por IMC/E]';
            if (zBMI <= -1.94) { diagWeight = 'Desnutrición'; diagWColor = '#c0392b'; }
            else if (zBMI <= -0.94) { diagWeight = 'Riesgo de Desnutrir'; diagWColor = '#e67e22'; }
            else if (zBMI >= 2.94) { diagWeight = 'Obesidad Severa'; diagWColor = '#8e44ad'; }
            else if (zBMI >= 1.94) { diagWeight = 'Obesidad'; diagWColor = '#c0392b'; }
            else if (zBMI >= 0.94) { diagWeight = 'Sobrepeso'; diagWColor = '#f39c12'; }
            else { diagWeight = 'Normal o Eutrófico'; diagWColor = '#27ae60'; }
        }

        let diagHeight = '';
        let diagHColor = '#888';
        if (zHFA !== null && !isNaN(zHFA)) {
            if (zHFA <= -2) { diagHeight = 'Talla Baja'; diagHColor = '#c0392b'; }
            else if (zHFA <= -1) { diagHeight = 'Talla Normal Baja'; diagHColor = '#f39c12'; }
            else if (zHFA >= +2) { diagHeight = 'Talla Alta'; diagHColor = '#3498db'; }
            else if (zHFA >= +1) { diagHeight = 'Talla Normal Alta'; diagHColor = '#2980b9'; }
            else { diagHeight = 'Normal'; diagHColor = '#27ae60'; }
        }
        p.diagWeight = diagWeight;
        p.diagHeight = diagHeight;

        html += makeBadge('P/E (Peso/Edad)', zWFA);
        html += makeBadge('T/E (Talla/Edad)', zHFA);
        if (m <= 60 && zWFH !== null && !isNaN(zWFH)) html += makeBadge('P/T (Peso/Talla)', zWFH);
        if (m > 60 && zBMI !== null && !isNaN(zBMI)) html += makeBadge('IMC/E', zBMI);
        html += ccBadge;

        if (diagWeight || diagHeight) {
            html += `<div style="grid-column: 1 / -1; display:flex; flex-direction:column; gap:6px; margin-top:8px;">`;
            if (diagWeight) {
                html += `<div style="background:${diagWColor}15; border-left:4px solid ${diagWColor}; padding:8px; border-radius:4px; font-weight:700; color:${diagWColor}; font-size:0.85rem; display:flex; flex-direction:column; gap:2px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span>Estado Nutricional (MINSAL)</span>
                                <span style="font-size:0.9rem;">${diagWeight}</span>
                            </div>
                            <div style="font-size:0.65rem; opacity:0.8; text-align:right;">${evaluatedBy}</div>
                         </div>`;
            }
            if (diagHeight) {
                html += `<div style="background:${diagHColor}15; border-left:4px solid ${diagHColor}; padding:8px; border-radius:4px; font-weight:700; color:${diagHColor}; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center;">
                            <span>Calificación Estatural</span>
                            <span style="font-size:0.9rem;">${diagHeight}</span>
                         </div>`;
            }

            // 3. Cintura Diagnosis
            const cInp = parseFloat(document.getElementById('ccintura')?.value) || 0;
            if (cInp > 0 && y >= 5 && y <= 19) {
                const table = window.WAIST_PERCENTILES?.[p.sexo];
                const refAge = (y >= 19) ? 19 : y;
                const ageData = table?.[refAge];
                if (ageData) {
                    let diagWaist = 'Normal (< p75)';
                    let waColor = '#27ae60';
                    if (cInp >= ageData.p90) { diagWaist = 'Obesidad Abdominal (>= p90)'; waColor = '#c0392b'; }
                    else if (cInp >= ageData.p75) { diagWaist = 'Riesgo Obesidad Adb. (>= p75)'; waColor = '#f39c12'; }

                    html += `<div style="background:${waColor}15; border-left:4px solid ${waColor}; padding:8px; border-radius:4px; font-weight:700; color:${waColor}; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center;">
                                <span>Perímetro Cintura</span>
                                <span style="font-size:0.9rem;">${diagWaist}</span>
                             </div>`;
                }
            }
            html += `</div>`;
        }
    }

    // NEW V3.95: Growth Velocity (g/kg/day) - Patel Formula / Net Growth
    const pesoAnterior = parseFloat(document.getElementById('pesoAnterior')?.value) || 0;
    const diasMedicion = parseFloat(document.getElementById('diasMedicion')?.value) || 0;
    const method = document.getElementById('growthVelocityMethod')?.value || 'net';
    
    // Explicit growth velocity calculator updating
    const valGrowthEl = document.getElementById('valGrowthVelocity');
    const resultBoxEl = document.getElementById('growthVelocityResult');
    
    let velGrowth = null;
    let vColor = '#7f8c8d';
    const unitStr = method === 'net' ? 'g/d' : 'g/kg/d';
    const limitLow = method === 'net' ? 20 : 15;
    const limitHigh = method === 'net' ? 30 : 20;
    
    if (p.peso > 0 && pesoAnterior > 0 && diasMedicion > 0) {
        if (method === 'net') {
            velGrowth = ((p.peso - pesoAnterior) * 1000) / diasMedicion;
        } else {
            velGrowth = (1000 * Math.log(p.peso / pesoAnterior)) / diasMedicion;
        }
        
        if (velGrowth < 0) vColor = '#c0392b';
        else if (velGrowth < limitLow) vColor = '#d35400';
        else if (velGrowth <= limitHigh) vColor = '#16a085';
        else vColor = '#2980b9';
        
        const labelText = method === 'net' ? 'Vel. Crec. (Neta)' : 'Vel. Crec. (Patel)';
        html += makeBadge(labelText, null, `${velGrowth.toFixed(1)} ${unitStr}`, vColor);
    }
    
    if (valGrowthEl && resultBoxEl) {
        if (velGrowth !== null) {
            valGrowthEl.innerText = `${velGrowth.toFixed(1)} ${unitStr}`;
            
            // Premium non-offensive eye-friendly pastel colors for the dashboard panel
            if (velGrowth < 0) {
                resultBoxEl.style.background = '#fcd0cf'; // Soft red/pink pastel
                resultBoxEl.style.borderColor = '#f5b7b1';
                valGrowthEl.style.color = '#c0392b';
            } else if (velGrowth < limitLow) {
                resultBoxEl.style.background = '#fef9e7'; // Soft yellow/orange
                resultBoxEl.style.borderColor = '#f9e79f';
                valGrowthEl.style.color = '#d35400';
            } else if (velGrowth <= limitHigh) {
                resultBoxEl.style.background = '#e8f8f5'; // Soft green mint
                resultBoxEl.style.borderColor = '#a3e4d7';
                valGrowthEl.style.color = '#16a085';
            } else {
                resultBoxEl.style.background = '#ebf5fb'; // Soft blue
                resultBoxEl.style.borderColor = '#a9cce3';
                valGrowthEl.style.color = '#2980b9';
            }
        } else {
            valGrowthEl.innerText = `-- ${unitStr}`;
            resultBoxEl.style.background = 'rgba(255,255,255,0.75)';
            resultBoxEl.style.borderColor = '#a3e4d7';
            valGrowthEl.style.color = '#7f8c8d';
        }
    }

    // NEW V3.95: Neuro Classifier (Head Circumference)
    const pcInput = parseFloat(document.getElementById('pcefalico')?.value) || 0;
    if (pcInput > 0) {
        const zHC = getZScore('hc', m, p.sexo, pcInput);
        if (zHC !== null && !isNaN(zHC)) {
            let diag = '';
            let color = '#27ae60';
            if (zHC <= -2.0) { diag = '<br><span style="font-size:0.6rem">Sosp. Microcefalia</span>'; color = '#c0392b'; }
            
            else if (zHC >= +2.0) { diag = '<br><span style="font-size:0.6rem">Sosp. Macrocefalia</span>'; color = '#c0392b'; }
            html += makeBadge('Perím. Cefálico', null, `Z: ${zHC > 0 ? '+' : ''}${zHC.toFixed(2)}${diag}`, color);
        } else {
            html += makeBadge('Perím. Cefálico', null, `${pcInput} cm (Sin Ref)`, '#95a5a6');
        }
    }

    if (!html) html = '<div style="grid-column:span 2; text-align:center; font-size:0.8rem; color:#888;">Ingresa Fecha de Nacimiento, Peso y Talla</div>';
    grid.innerHTML = html;
}

window.calcFactorial = () => {
    calcFactorialNoRecursion();
    window.updateSelectedGET();
    runSimulation();
};

window.calcTMB_OMS = () => {
    calculateRequirements();
};

window.updateSelectedGET = () => {
    const p = AppState.patient;
    const isFactorial = document.getElementById('radioFactorial')?.checked;

    let officialGET = 0;
    if (isFactorial) {
        officialGET = p.factorial_calculated || 0;
    } else {
        officialGET = p.tmt_calculated || 0;
    }

    p.tmt = officialGET;
    document.getElementById('valGET').innerText = `${Math.round(officialGET)} kcal`;
    updateMacroGoals();
};

// --- 8. SIMULATOR LOGIC ---
// --- NEW V5.00: Neonatal & Pediatric Volume Frequency (Times) Helpers ---
window.getEffectiveSimulationVolume = () => {
    const rawVol = parseFloat(document.getElementById('volume')?.value) || 0;
    const mode = document.querySelector('input[name="patientType"]:checked')?.value || 'adult';
    let times = 1;
    if (mode === 'pediatric' || mode === 'neonate') {
        const tInp = document.getElementById('volumeTimes');
        times = tInp ? parseFloat(tInp.value) : 1;
        if (isNaN(times) || times < 1) times = 1;
        if (times > 8) {
            times = 8;
            if (tInp) tInp.value = 8;
        }
    }
    return rawVol * times;
};

window.updateVolumeTotal = () => {
    const totalVolume = window.getEffectiveSimulationVolume();
    const totalDisplay = document.getElementById('volumeTotalDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = `${Math.round(totalVolume)} ml`;
    }
    return totalVolume;
};

function initSimulatorLogic() {
    const vol = document.getElementById('volume');
    const dil = document.getElementById('dilution');
    const btnSave = document.getElementById('btnSaveHistory');
    const timesInp = document.getElementById('volumeTimes');

    if (vol) {
        vol.oninput = () => {
            window.updateVolumeTotal();
            runSimulation();
        };
    }
    if (dil) dil.oninput = runSimulation;
    const dilSelect = document.getElementById('dilutionSelect');
    if (dilSelect) {
        dilSelect.onchange = () => {
            if (dil) {
                dil.value = dilSelect.value;
                runSimulation();
            }
        };
    }
    if (btnSave) btnSave.onclick = savePrescription;

    if (timesInp) {
        timesInp.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (val > 8) e.target.value = 8;
            window.updateVolumeTotal();
            runSimulation();
        });
        timesInp.addEventListener('blur', (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val) || val < 1) e.target.value = 1;
            window.updateVolumeTotal();
            runSimulation();
        });
    }

    // Trigger update on any module/oral/iv input change
    document.querySelectorAll('.input-module, .input-oral, .input-iv, #ivType').forEach(inp => {
        inp.addEventListener('input', runSimulation);
    });

    // Escuchas para regímenes predefinidos y barra de consumo
    const oralDietType = document.getElementById('oralDietType');
    const oralIntakePercent = document.getElementById('oralIntakePercent');
    const viaAlimentacionSelect = document.getElementById('viaAlimentacionSelect');
    if (oralDietType) oralDietType.addEventListener('change', updateOralIntakePreset);
    if (oralIntakePercent) oralIntakePercent.addEventListener('input', updateOralIntakeSlider);
    if (viaAlimentacionSelect) {
        viaAlimentacionSelect.addEventListener('change', () => {
            if (!AppState.patient.metadata) AppState.patient.metadata = {};
            AppState.patient.metadata.via_alimentacion = viaAlimentacionSelect.value;
        });
    }

    // Si el usuario edita de forma manual los campos, revertir a "Personalizado" y 100% de barra
    document.querySelectorAll('.input-oral').forEach(inp => {
        inp.addEventListener('input', () => {
            const oralDietType = document.getElementById('oralDietType');
            const oralIntakePercent = document.getElementById('oralIntakePercent');
            const badge = document.getElementById('oralIntakePercentBadge');
            if (oralDietType && oralDietType.value !== 'custom') {
                oralDietType.value = 'custom';
            }
            if (oralIntakePercent) {
                oralIntakePercent.value = 100;
            }
            if (badge) {
                badge.innerText = '100%';
            }
        });
    });

    // Favorites Logic
    const btnFav = document.getElementById('btnToggleFav');
    if (btnFav) {
        btnFav.onclick = () => {
            const fSel = document.getElementById('formulaSelect');
            if (!fSel) return;
            const fId = fSel.value;
            if (!fId) return;

            if (AppState.favorites.includes(fId)) {
                AppState.favorites = AppState.favorites.filter(id => id !== fId);
            } else {
                AppState.favorites.push(fId);
            }
            localStorage.setItem('sedile_favs', JSON.stringify(AppState.favorites));
            updateFormulaSelect(); // Re-render to sort
            const fSelNew = document.getElementById('formulaSelect');
            if (fSelNew) fSelNew.value = fId; // Restore selection
            checkFavoriteStatus();
        };
    }
    
    // Inicializar estados de anamnesis y STRONGkids / NRS 2002
    if (typeof window.initAnamnesisToggles === 'function') {
        window.initAnamnesisToggles();
    }
    
    // NEW: Sincronizar visibilidad de tamizajes condicionales en la carga inicial
    if (typeof window.togglePatientMode === 'function') {
        window.togglePatientMode();
    }
}

function checkFavoriteStatus() {
    const fId = document.getElementById('formulaSelect').value;
    const btn = document.getElementById('btnToggleFav');
    if (!btn) return;

    if (AppState.favorites.includes(fId)) {
        btn.innerText = '⭐';
        btn.style.background = 'gold';
        btn.style.color = 'white';
        btn.style.borderColor = 'gold';
    } else {
        btn.innerText = '☆';
        btn.style.background = 'transparent';
        btn.style.color = 'var(--primary)';
        btn.style.borderColor = 'var(--primary)';
    }
}

function initFormulaSearch() {
    const search = document.getElementById('formulaSearch');
    if (search) {
        search.oninput = (e) => {
            updateFormulaSelect(e.target.value);
        };
    }
}

function updateFormulaSelect(filter = "") {
    // AGGRESSIVE FALLBACK V3.21: Use LOCAL_FORMULAS if AppState is empty
    if (!AppState.formulas || AppState.formulas.length === 0) {
        console.warn("⚠️ AppState.formulas empty, reloading from LOCAL_FORMULAS...");
        AppState.formulas = [...LOCAL_FORMULAS];
    } else {
        // Ensure all local ones are present (V3.26 Force sync)
        if (AppState.formulas.length < LOCAL_FORMULAS.length) {
            AppState.formulas = [...LOCAL_FORMULAS];
        }
    }

    const selects = [
        document.getElementById('formulaSelect'),
        document.getElementById('formulaSelectB'),
        document.getElementById('customF1'),
        document.getElementById('customF2')
    ];

    // Sort logic: Favorites first, then by Category
    const normalizedFilter = filter.toLowerCase().trim();

    const sortedFormulas = [...AppState.formulas]
        .filter(f => f && f.cat && !f.cat.includes("RTH"))
        .filter(f => !normalizedFilter || (f.name && f.name.toLowerCase().includes(normalizedFilter)) || (f.cat && f.cat.toLowerCase().includes(normalizedFilter)))
        .sort((a, b) => {
            const aFav = AppState.favorites.includes(a.id);
            const bFav = AppState.favorites.includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });

    const cats = [...new Set(sortedFormulas.map(i => i.cat).filter(Boolean))];

    selects.forEach(sel => {
        if (!sel) return;
        const currentVal = sel.value; // preserve value if possible (rare)
        sel.innerHTML = '<option value="">Seleccione Fórmula...</option>';

        cats.forEach(cat => {
            const group = document.createElement('optgroup');
            group.label = cat;
            sortedFormulas.filter(i => i.cat === cat).forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                const star = AppState.favorites.includes(item.id) ? '⭐ ' : '';
                opt.innerText = star + item.name;
                group.appendChild(opt);
            });
            sel.appendChild(group);
        });

        // Restore if value exists in new options
        if (currentVal) sel.value = currentVal;
    });

    // Event Listeners
    if (selects[0]) {
        selects[0].onchange = () => {
            const f = AppState.formulas.find(x => x.id === selects[0].value);
            renderFormulaInputs(f);
            runSimulation();
            checkFavoriteStatus();
        };
    }
    if (selects[1]) {
        selects[1].onchange = () => {
            AppState.formulaB = AppState.formulas.find(f => f.id === selects[1].value);
            runSimulation(); // Updates compare results
        };
    }
}

function renderMinerals() {
    const gridA = document.getElementById('mineralsGrid');
    const gridB = document.getElementById('mineralsGridB');
    if (!gridA) return;

    const isCustomMix = document.getElementById('customMixContainer') && document.getElementById('customMixContainer').style.display === 'block';
    if (isCustomMix) {
        gridA.innerHTML = "<div style='color:#7f8c8d; grid-column: 1 / -1; font-size:0.75rem; padding:10px;'>Minerales no disponibles en mezcla personalizada aún.</div>";
        if(gridB) gridB.style.display = 'none';
        return;
    }

    const isComparing = document.getElementById('compareRow').style.display === 'block' || document.getElementById('compareRow').style.display === 'flex';
    const fA = AppState.formulas.find(x => x.id === document.getElementById('formulaSelect').value);
    const fB = isComparing ? AppState.formulas.find(x => x.id === document.getElementById('formulaSelectB').value) : null;

    if (!fA) {
        gridA.innerHTML = "<div style='color:#7f8c8d; grid-column: 1 / -1; padding:10px;'>Seleccione una fórmula para ver minerales</div>";
        if(gridB) gridB.style.display = 'none';
        return;
    }

    const v1 = window.getEffectiveSimulationVolume();
    const v2 = parseFloat(document.getElementById('dilution').value) || 0;
    const dilBInput = document.getElementById('dilutionB');
    const v2B = dilBInput && dilBInput.value !== "" ? parseFloat(dilBInput.value) : v2;

    const getFactor = (f) => {
        const vol = f.isBotellin ? (v1 * f.volUnit) : v1;
        if (vol <= 0) return 0;
        if (f.type === 'p') {
            const dil = v2 > 0 ? v2 : (f.stdDil || 15);
            return (vol * (dil / 100)) / 100;
        } else {
            return vol / 100;
        }
    };

    const factorA = getFactor(fA);
    const factorB = fB ? getFactor(fB) : 0;

    const items = [
        { id: "na", name: "Sodio", icon: "🧂" },
        { id: "k", name: "Potasio", icon: "🍌" },
        { id: "cl", name: "Cloro", icon: "🧪" },
        { id: "ca", name: "Calcio", icon: "🦴" },
        { id: "p", name: "Fósforo", icon: "🐟" },
        { id: "mg", name: "Magnesio", icon: "🥬" },
        { id: "fe", name: "Hierro", icon: "🩸" },
        { id: "zn", name: "Zinc", icon: "🛡️" },
        { id: "cu", name: "Cobre", icon: "⚡" },
        { id: "i", name: "Yodo", icon: "🌊" },
        { id: "mn", name: "Manganeso", icon: "🌰" },
        { id: "se", name: "Selenio", icon: "🌾" },
        { id: "cr", name: "Cromo", icon: "💎" },
        { id: "mo", name: "Molibdeno", icon: "⚙️" }
    ];

    if (!fA.minerals || Object.keys(fA.minerals).length === 0) {
        gridA.innerHTML = "<div style='color:#7f8c8d; grid-column: 1 / -1; padding:10px;'>Sin datos de minerales para " + fA.name + "</div>";
    } else {
        gridA.innerHTML = items.map(i => {
            const valA = fA.minerals[i.id];
            if (valA === undefined) return "";
            const finalA = (valA * factorA).toFixed(1).replace('.', ',');
            
            let displayVal = `${finalA} mg`;
            if (fB && fB.minerals && fB.minerals[i.id] !== undefined) {
                const finalB = (fB.minerals[i.id] * factorB).toFixed(1).replace('.', ',');
                displayVal = `${finalA} / ${finalB} mg`;
            }

            return `<div style="background:#fff; border:1px solid #eee; border-radius:4px; padding:4px; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:50px;">
                <span style="font-size:0.8rem;">${i.icon}</span>
                <span style="font-weight:800; color:#2c3e50; margin:1px 0; font-size:0.7rem; white-space:nowrap;">${displayVal}</span>
                <span style="font-size:0.55rem; color:#7f8c8d; text-transform:uppercase; font-weight:700;">${i.name}</span>
            </div>`;
        }).join('');
    }

    if (gridB) gridB.style.display = 'none';
}

window.toggleCustomMix = function() {
    const container = document.getElementById('customMixContainer');
    const mainSelectGrp = document.getElementById('formulaSelect').parentElement.parentElement;
    const dilWrapper = document.getElementById('dilutionWrapper');
    const minPanel = document.getElementById('mineralsPanel');
    const isVisible = container.style.display === 'block';
    
    if (isVisible) {
        container.style.display = 'none';
        mainSelectGrp.style.display = 'block';
        if(dilWrapper) dilWrapper.style.display = 'block';
        if(minPanel) minPanel.style.display = 'block';
    } else {
        container.style.display = 'block';
        mainSelectGrp.style.display = 'none';
        if(dilWrapper) dilWrapper.style.display = 'none';
        if(minPanel) minPanel.style.display = 'none';
    }
    window.runSimulation();
};

function renderFormulaInputs(formula) {
    renderMinerals(formula);
    const wrapper = document.getElementById('dilutionWrapper');
    const container = document.getElementById('recipeInputsContainer');
    const baseDilInput = document.getElementById('dilution');
    const baseDilSelect = document.getElementById('dilutionSelect');

    if (!formula) {
        if (wrapper) wrapper.style.display = 'block';
        if (baseDilInput) baseDilInput.style.display = 'block';
        if (baseDilSelect) baseDilSelect.style.display = 'none';
        if (container) container.style.display = 'none';
        return;
    }

    if (wrapper) wrapper.style.display = 'block';

    if (formula.allowedDilutions) {
        if (baseDilInput) baseDilInput.style.display = 'none';
        if (baseDilSelect) {
            baseDilSelect.style.display = 'block';
            baseDilSelect.innerHTML = '';
            formula.allowedDilutions.forEach(dilVal => {
                const opt = document.createElement('option');
                opt.value = dilVal;
                opt.innerText = dilVal + '%';
                baseDilSelect.appendChild(opt);
            });
            const valStr = baseDilInput.value;
            const hasVal = formula.allowedDilutions.map(String).includes(valStr);
            if (!hasVal) {
                baseDilInput.value = formula.allowedDilutions[0];
            }
            baseDilSelect.value = baseDilInput.value;
        }
    } else {
        if (baseDilInput) baseDilInput.style.display = 'block';
        if (baseDilSelect) baseDilSelect.style.display = 'none';
        if (formula.stdDil && baseDilInput) {
            baseDilInput.value = formula.stdDil;
        }
    }

    // NEW V4.50: Botellines Logic for Volume Label
    const lblVolume = document.getElementById('lblVolume');
    const inputVolume = document.getElementById('volume');
    if (lblVolume && inputVolume) {
        if (formula.isBotellin) {
            lblVolume.innerText = `Unidades (Botellín ${formula.volUnit}cc)`;
            inputVolume.placeholder = 'Ej: 1, 2...';
        } else {
            lblVolume.innerText = 'Volumen (ml)';
            inputVolume.placeholder = 'ml';
        }
    }
}

function renderFormulaBInputs() {
    const fIdB = document.getElementById('formulaSelectB')?.value;
    const formulaB = AppState.formulas.find(f => f.id === fIdB);
    const baseDilBInput = document.getElementById('dilutionB');
    const baseDilBSelect = document.getElementById('dilutionBSelect');

    if (!baseDilBInput) return;

    if (formulaB && formulaB.allowedDilutions) {
        baseDilBInput.style.display = 'none';
        if (baseDilBSelect) {
            baseDilBSelect.style.display = 'block';
            baseDilBSelect.innerHTML = '';
            formulaB.allowedDilutions.forEach(dilVal => {
                const opt = document.createElement('option');
                opt.value = dilVal;
                opt.innerText = dilVal + '%';
                baseDilBSelect.appendChild(opt);
            });
            const valStr = baseDilBInput.value;
            const hasVal = formulaB.allowedDilutions.map(String).includes(valStr);
            if (!hasVal) {
                baseDilBInput.value = formulaB.allowedDilutions[0];
            }
            baseDilBSelect.value = baseDilBInput.value;
        }
    } else {
        baseDilBInput.style.display = 'block';
        if (baseDilBSelect) baseDilBSelect.style.display = 'none';
        if (formulaB && formulaB.stdDil) {
            baseDilBInput.value = formulaB.stdDil;
        }
    }
}

// --- CONSTANTE DE REGÍMENES CLÍNICOS ---
const ORAL_PRESETS = {
    comun: { kcal: 2000, prot: 80, cho: 280, lip: 60 },
    liviano: { kcal: 2055, prot: 84.5, cho: 292, lip: 46.6 },
    blando: { kcal: 1900, prot: 75, cho: 270, lip: 55 },
    blando_sin_residuos: { kcal: 1874, prot: 74, cho: 309, lip: 38 },
    papilla: { kcal: 1600, prot: 70, cho: 230, lip: 45 },
    papilla_liviana: { kcal: 1587, prot: 63.5, cho: 217, lip: 47.2 },
    papilla_diabetico: { kcal: 1537, prot: 77.2, cho: 192, lip: 47.5 },
    hiposodico: { kcal: 2063, prot: 82, cho: 297, lip: 45.7 },
    hypercalorico: { kcal: 2445, prot: 113.8, cho: 366, lip: 48.1 },
    hyperproteico: { kcal: 2448, prot: 132, cho: 348, lip: 46 },
    hipocalorico: { kcal: 1486, prot: 75.7, cho: 165, lip: 44 },
    hipoproteico: { kcal: 1925, prot: 25, cho: 314, lip: 46 },
    hipoglucidico: { kcal: 1480, prot: 97.2, cho: 151, lip: 44.3 },
    isoglucidico_160: { kcal: 1530, prot: 97.4, cho: 165, lip: 41 },
    isoglucidico_200: { kcal: 1634, prot: 111.5, cho: 198, lip: 43 },
    liquido: { kcal: 1200, prot: 45, cho: 190, lip: 30 },
    cero: { kcal: 0, prot: 0, cho: 0, lip: 0 }
};

window.detectFeedingRoute = () => {
    const viaSel = document.getElementById('viaAlimentacionSelect')?.value;
    if (viaSel && viaSel !== 'auto') {
        return viaSel;
    }
    
    // Auto-detection
    const hasEnteral = !!(document.getElementById('formulaSelect')?.value && parseFloat(document.getElementById('volume')?.value) > 0);
    const hasIV = !!(document.getElementById('ivType')?.value && parseFloat(document.getElementById('ivVolume')?.value) > 0);
    const dietSelect = document.getElementById('oralDietType');
    const oralKcal = parseFloat(document.getElementById('oralKcal')?.value) || 0;
    const isCero = dietSelect && dietSelect.value === 'cero';
    const hasOral = (dietSelect && dietSelect.value && dietSelect.value !== 'custom' && !isCero) || oralKcal > 0;

    if (isCero) return 'cero';
    if (hasIV && !hasEnteral && !hasOral) return 'parenteral_central';
    if (hasEnteral && hasOral) return 'mixta';
    if (hasEnteral) return 'sng';
    if (hasOral) return 'oral';
    return 'oral';
};

window.getFeedingRouteLabel = (routeKey) => {
    switch (routeKey) {
        case 'oral': return 'Vía Oral';
        case 'sng': return 'Sonda Nasogástrica (SNG)';
        case 'sne': return 'Sonda Nasoyeyunal (SNE)';
        case 'gtt': return 'Gastrostomía (GTT)';
        case 'yey': return 'Yeyunostomía (YEY)';
        case 'mixta': return 'Vía Mixta (Oral + Enteral)';
        case 'parenteral_central': return 'Vía Central (Parenteral)';
        case 'parenteral_periferica': return 'Vía Periférica (Parenteral)';
        case 'cero': return 'Régimen Cero (Ayuno)';
        default: return 'Vía Oral';
    }
};

window.getSelectedRegimenName = () => {
    const dietSelect = document.getElementById('oralDietType');
    if (dietSelect && dietSelect.value && dietSelect.value !== 'custom') {
        const rawOpt = dietSelect.options[dietSelect.selectedIndex]?.text || '';
        return rawOpt.replace(/\s*\(\d+\s*kcal\)/i, '').trim();
    }
    if (AppState.patient?.metadata?.regimen) {
        return AppState.patient.metadata.regimen.trim();
    }
    return '';
};

window.syncOralDietToWardAndState = () => {
    const dietSelect = document.getElementById('oralDietType');
    if (!dietSelect) return;
    let cleanName = '';
    if (dietSelect.value !== 'custom') {
        const rawOpt = dietSelect.options[dietSelect.selectedIndex]?.text || '';
        cleanName = rawOpt.replace(/\s*\(\d+\s*kcal\)/i, '').trim();
    } else {
        cleanName = AppState.patient?.metadata?.regimen || '';
    }

    if (!AppState.patient.metadata) AppState.patient.metadata = {};
    if (cleanName) {
        AppState.patient.metadata.regimen = cleanName;
    }

    const patientId = AppState.patient.id;
    if (patientId) {
        // 1. Update local_ward_patients
        try {
            let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
            const pIdx = localCache.findIndex(p => p.id === patientId || (p.cama && p.cama === AppState.patient.cama && p.cama !== ''));
            if (pIdx >= 0) {
                if (!localCache[pIdx].metadata) localCache[pIdx].metadata = {};
                localCache[pIdx].metadata.regimen = cleanName;
                localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
            }
        } catch(e) {}

        // 2. Update visible table cell if rendered
        const row = document.querySelector(`tr[data-patient-id="${patientId}"]`);
        if (row) {
            const dietInput = row.querySelector('.col-dieta textarea, .col-dieta input');
            if (dietInput && cleanName) {
                dietInput.value = cleanName;
            }
        }

        // 3. Update Supabase if valid UUID
        if (cleanName && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId)) {
            if (typeof window.quickUpdatePatientField === 'function') {
                window.quickUpdatePatientField(patientId, 'regimen', cleanName);
            }
        }
    }
};

window.generateDietoterapiaString = (kcalFinal, protFinal, pesoCalc) => {
    let aporteStr = `${kcalFinal} kcal`;
    if (pesoCalc > 0) {
        aporteStr += ` (${(kcalFinal / pesoCalc).toFixed(1)} kcal/kg)`;
    }
    aporteStr += ` / ${protFinal} g proteína`;
    if (pesoCalc > 0) {
        aporteStr += ` (${(parseFloat(protFinal) / pesoCalc).toFixed(2)} g/kg)`;
    }

    const regimenName = window.getSelectedRegimenName ? window.getSelectedRegimenName() : '';
    const route = window.detectFeedingRoute ? window.detectFeedingRoute() : 'oral';
    const routeLabel = window.getFeedingRouteLabel ? window.getFeedingRouteLabel(route) : 'Vía Oral';

    // Enteral info
    let enteralStr = '';
    const fId = document.getElementById('formulaSelect')?.value;
    const formula = AppState.formulas?.find(f => f.id === fId);
    const volVal = parseFloat(document.getElementById('volume')?.value) || 0;
    const timesVal = parseInt(document.getElementById('volumeTimes')?.value) || 1;
    const volTotal = volVal * timesVal;
    if (formula && volTotal > 0) {
        enteralStr = `Soporte Enteral: ${formula.name} (${timesVal > 1 ? `${volVal} ml x ${timesVal}` : `${volTotal} ml`}`;
        const dilVal = document.getElementById('dilution')?.value;
        if (dilVal && parseFloat(dilVal) > 0) enteralStr += `, Dilución: ${dilVal}%`;
        enteralStr += `)`;
    }

    // Parenteral info
    let ivStr = '';
    const ivType = document.getElementById('ivType')?.value;
    const ivVol = parseFloat(document.getElementById('ivVolume')?.value) || 0;
    if (ivType && ivVol > 0) {
        ivStr = `Soporte Parenteral: ${ivType} (${ivVol} ml)`;
    }

    // Modules info
    let modParts = [];
    if (parseFloat(document.getElementById('modNessucar')?.value) > 0) modParts.push(`Nessucar ${document.getElementById('modNessucar').value}g`);
    if (parseFloat(document.getElementById('modMCT')?.value) > 0) modParts.push(`MCT Oil ${document.getElementById('modMCT').value}g`);
    if (parseFloat(document.getElementById('modEnterex')?.value) > 0) modParts.push(`Enterex ${document.getElementById('modEnterex').value}g`);
    if (parseFloat(document.getElementById('modBanatrol')?.value) > 0) modParts.push(`Banatrol ${document.getElementById('modBanatrol').value}g`);
    if (parseFloat(document.getElementById('modProteinex')?.value) > 0) modParts.push(`Proteinex ${document.getElementById('modProteinex').value}g`);
    if (parseFloat(document.getElementById('modFresubin')?.value) > 0) modParts.push(`Fresubin Protein ${document.getElementById('modFresubin').value}g`);
    const modStr = modParts.length > 0 ? `Módulos: ${modParts.join(', ')}` : '';

    let baseDiet = '';
    if (route === 'cero' || (regimenName && /cero|ayuno/i.test(regimenName))) {
        baseDiet = 'Régimen Cero (Ayuno)';
    } else if (route === 'oral' || (!enteralStr && !ivStr)) {
        if (regimenName) {
            baseDiet = `Régimen ${regimenName} distribuido en 4 servicios principales`;
        } else {
            baseDiet = `Régimen común según indicación clínica distribuido en 4 servicios principales`;
        }
    } else if (route === 'mixta' || (regimenName && enteralStr)) {
        const oralPart = regimenName ? `Régimen ${regimenName} distribuido en 4 servicios principales` : 'Alimentación Oral';
        baseDiet = `${oralPart} + ${enteralStr} por ${routeLabel}`;
    } else if (enteralStr) {
        baseDiet = `${enteralStr} por ${routeLabel}`;
    } else if (ivStr) {
        baseDiet = `${ivStr} por ${routeLabel}`;
    } else {
        baseDiet = regimenName ? `Régimen ${regimenName}` : 'Régimen según indicación clínica';
    }

    let result = baseDiet;
    if (modStr) result += ` | ${modStr}`;
    result += ` | Aporte: ${aporteStr}`;
    return result;
};

window.getEffectiveNutritionalGoal = () => {
    const p = AppState.patient || {};
    const pesoFisico = p.peso || parseFloat(document.getElementById('peso')?.value) || 0;
    const pesoCalc = document.getElementById('pesoCalculoSelect')?.value === 'real' ? pesoFisico : (p.peso_calculo || pesoFisico);

    // 1. Direct goalTotal input
    const inpGoal = parseFloat(document.getElementById('goalTotal')?.value);
    if (!isNaN(inpGoal) && inpGoal > 0) return inpGoal;

    // 2. Kcal/kg Box * peso
    const kcalBox = parseFloat(document.getElementById('goalKcalBox')?.value);
    if (!isNaN(kcalBox) && kcalBox > 0 && pesoCalc > 0) return Math.round(kcalBox * pesoCalc);

    // 3. Official GET displayed in UI
    const valGetEl = document.getElementById('valGET');
    if (valGetEl && valGetEl.innerText) {
        const parsed = parseFloat(valGetEl.innerText.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) return Math.round(parsed);
    }

    // 4. Patient state stored values
    if (p.tmt && p.tmt > 0) return Math.round(p.tmt);
    if (p.tmt_calculated && p.tmt_calculated > 0) return Math.round(p.tmt_calculated);
    if (p.factorial_calculated && p.factorial_calculated > 0) return Math.round(p.factorial_calculated);

    // 5. resFactorial or resTMB
    const resFactEl = document.getElementById('resFactorial');
    if (resFactEl && resFactEl.innerText) {
        const parsed = parseFloat(resFactEl.innerText.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) return Math.round(parsed);
    }
    const resTmbEl = document.getElementById('resTMB');
    if (resTmbEl && resTmbEl.innerText) {
        const parsed = parseFloat(resTmbEl.innerText.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) return Math.round(parsed);
    }

    // 6. Factor Kcal input * peso
    const factorKcal = parseFloat(document.getElementById('factorKcal')?.value);
    if (!isNaN(factorKcal) && factorKcal > 0 && pesoCalc > 0) return Math.round(factorKcal * pesoCalc);

    return 0;
};

window.getEffectiveMacroRequirements = () => {
    if (typeof updateMacroGoals === 'function') {
        try { updateMacroGoals(); } catch(e) {}
    }

    const p = AppState.patient || {};
    const pesoFisico = p.peso || parseFloat(document.getElementById('peso')?.value) || 0;
    const pesoCalc = document.getElementById('pesoCalculoSelect')?.value === 'real' ? pesoFisico : (p.peso_calculo || pesoFisico);

    const goal = window.getEffectiveNutritionalGoal ? window.getEffectiveNutritionalGoal() : (parseFloat(document.getElementById('goalTotal')?.value) || 0);

    const valP = parseFloat(document.getElementById('goalProtKg')?.value) || 0;
    const valC = parseFloat(document.getElementById('goalCHOKg')?.value) || 0;
    const valL = parseFloat(document.getElementById('goalLipKg')?.value) || 0;

    let pTotal = parseFloat(document.getElementById('goalProt')?.dataset.val) || 0;
    let cTotal = parseFloat(document.getElementById('goalCHO')?.dataset.val) || 0;
    let lTotal = parseFloat(document.getElementById('goalLip')?.dataset.val) || 0;

    let pPct = 0;
    let cPct = 0;
    let lPct = 0;

    const isPctMode = typeof macroGoalMode !== 'undefined' && macroGoalMode === 'pct';

    if (isPctMode) {
        pPct = valP;
        cPct = valC;
        lPct = valL;

        if (pTotal === 0 && goal > 0 && pPct > 0) {
            pTotal = (goal * (pPct / 100)) / 4;
        }
        if (cTotal === 0 && goal > 0 && cPct > 0) {
            cTotal = (goal * (cPct / 100)) / 4;
        }
        if (lTotal === 0 && goal > 0 && lPct > 0) {
            lTotal = (goal * (lPct / 100)) / 9;
        }
    } else {
        if (pTotal === 0 && valP > 0 && pesoCalc > 0) {
            pTotal = valP * pesoCalc;
        }
        if (cTotal === 0 && valC > 0 && pesoCalc > 0) {
            cTotal = valC * pesoCalc;
        }
        if (lTotal === 0 && valL > 0 && pesoCalc > 0) {
            lTotal = valL * pesoCalc;
        }

        if (goal > 0) {
            pPct = parseFloat(((pTotal * 4) / goal * 100).toFixed(0));
            cPct = parseFloat(((cTotal * 4) / goal * 100).toFixed(0));
            lPct = parseFloat(((lTotal * 9) / goal * 100).toFixed(0));
        }
    }

    const factorKcalVal = parseFloat(document.getElementById('factorKcal')?.value) || (pesoCalc > 0 && goal > 0 ? (goal / pesoCalc).toFixed(0) : 0);
    const factorProtVal = (!isPctMode && valP > 0) ? valP.toFixed(1) : (pesoCalc > 0 && pTotal > 0 ? (pTotal / pesoCalc).toFixed(1) : 0);

    return {
        goal: Math.round(goal),
        pTotal,
        cTotal,
        lTotal,
        pPct: Math.round(pPct),
        cPct: Math.round(cPct),
        lPct: Math.round(lPct),
        factorKcalVal,
        factorProtVal
    };
};

function updateOralIntakePreset() {
    const dietSelect = document.getElementById('oralDietType');
    if (!dietSelect) return;
    const diet = dietSelect.value;
    const percent = parseFloat(document.getElementById('oralIntakePercent')?.value) || 100;
    
    if (diet !== 'custom') {
        const preset = ORAL_PRESETS[diet];
        if (preset) {
            document.getElementById('oralKcal').value = Math.round(preset.kcal * (percent / 100));
            document.getElementById('oralProt').value = (preset.prot * (percent / 100)).toFixed(1);
            document.getElementById('oralCHO').value = (preset.cho * (percent / 100)).toFixed(1);
            document.getElementById('oralLip').value = (preset.lip * (percent / 100)).toFixed(1);
            runSimulation();
        }
    }

    // Sync selected regimen with patient state and ward censo
    window.syncOralDietToWardAndState();
}

function updateOralIntakeSlider() {
    const percent = document.getElementById('oralIntakePercent').value;
    const badge = document.getElementById('oralIntakePercentBadge');
    if (badge) badge.innerText = percent + '%';
    
    const diet = document.getElementById('oralDietType').value;
    if (diet !== 'custom') {
        updateOralIntakePreset();
    }
}

function runSimulation() {
    const isCustomMix = document.getElementById('customMixContainer') && document.getElementById('customMixContainer').style.display === 'block';

    const v1 = window.getEffectiveSimulationVolume();
    const v2 = parseFloat(document.getElementById('dilution').value) || 0;
    const dilBInput = document.getElementById('dilutionB');
    const v2B = dilBInput && dilBInput.value !== "" ? parseFloat(dilBInput.value) : v2;

    let k = 0, p = 0, c = 0, l = 0;

    if (isCustomMix) {
        const f1Id = document.getElementById('customF1')?.value;
        const f2Id = document.getElementById('customF2')?.value;
        const pct1 = parseFloat(document.getElementById('customPct1')?.value) || 0;
        const pct2 = parseFloat(document.getElementById('customPct2')?.value) || 0;

        const f1 = AppState.formulas.find(f => f.id === f1Id);
        const f2 = AppState.formulas.find(f => f.id === f2Id);

        if (f1) {
            const grams1 = v1 * (pct1 / 100);
            k += f1.k * (grams1 / 100);
            p += f1.p * (grams1 / 100);
            c += f1.c * (grams1 / 100);
            l += f1.f * (grams1 / 100);
        }
        if (f2) {
            const grams2 = v1 * (pct2 / 100);
            k += f2.k * (grams2 / 100);
            p += f2.p * (grams2 / 100);
            c += f2.c * (grams2 / 100);
            l += f2.f * (grams2 / 100);
        }
    } else {
        const fId = document.getElementById('formulaSelect').value;
        const formula = AppState.formulas.find(f => f.id === fId);

        if (formula) {
            const vol = formula.isBotellin ? (v1 * formula.volUnit) : v1;
            if (formula.type === 'recipe') {
                formula.recipe.forEach(rec => {
                    const grams = vol * (rec.defPct / 100);
                    k += rec.k * (grams / 100);
                    p += rec.p * (grams / 100);
                    c += rec.c * (grams / 100);
                    l += rec.f * (grams / 100);
                });
            } else if (formula.type === 'p') {
                const dil = v2 > 0 ? v2 : (formula.stdDil || 0);
                const grams = vol * (dil / 100);
                k = formula.k * (grams / 100);
                p = formula.p * (grams / 100);
                c = formula.c * (grams / 100);
                l = formula.f * (grams / 100);
            } else {
                let scl = 1;
                if (formula.stdDil && v2 > 0) scl = v2 / formula.stdDil;
                k = formula.k * (vol / 100) * scl;
                p = formula.p * (vol / 100) * scl;
                c = formula.c * (vol / 100) * scl;
                l = formula.f * (vol / 100) * scl;
            }
        }
    }

    // NEW V3.64: Update Base Formula Subtotal Board BEFORE adding modules/oral
    const elSubK = document.getElementById('subKcalBase');
    const elSubP = document.getElementById('subProtBase');
    const elSubC = document.getElementById('subCHOBase');
    const elSubL = document.getElementById('subLipBase');
    if (elSubK) elSubK.innerText = Math.round(k);
    if (elSubP) elSubP.innerText = p.toFixed(1);
    if (elSubC) elSubC.innerText = c.toFixed(1);
    if (elSubL) elSubL.innerText = l.toFixed(1);

    // NEW V3.95: PreNAN FM85 Fortifier (Neonates only)
    if (AppState.patient.type === 'neonate') {
        const fortPct = parseFloat(document.getElementById('fortifierPercent')?.value) || 0;
        if (fortPct > 0) {
            let baseVolForFM85 = 0;
            baseVolForFM85 = v1;
            const fortGrams = baseVolForFM85 * (fortPct / 100);
            const fgInput = document.getElementById('fortifierGrams');
            if (fgInput) fgInput.value = fortGrams.toFixed(1);

            // FM85 Macros per 100g: 348 kcal, 20g Prot, 66.4g CHO
            k += (fortGrams * 348 / 100);
            p += (fortGrams * 20 / 100);
            c += (fortGrams * 66.4 / 100);
        } else {
            const fgInput = document.getElementById('fortifierGrams');
            if (fgInput) fgInput.value = '';
        }
    }

    // Factor in Modules V3.50/V3.61
    let modK = 0, modP = 0, modC = 0, modL = 0;
    const mNess = parseFloat(document.getElementById('modNessucar').value) || 0;
    modK += (mNess * MODULE_DATA.nessucar.kcal / 100);
    modC += (mNess * MODULE_DATA.nessucar.c / 100);

    const mMCT = parseFloat(document.getElementById('modMCT').value) || 0;
    modK += (mMCT * MODULE_DATA.mct.kcal / 100);
    modL += (mMCT * MODULE_DATA.mct.f / 100);

    const mEnt = parseFloat(document.getElementById('modEnterex').value) || 0;
    modK += (mEnt * MODULE_DATA.enterex.kcal / 100);
    modC += (mEnt * MODULE_DATA.enterex.c / 100);

    const mBan = parseFloat(document.getElementById('modBanatrol').value) || 0;
    modK += (mBan * MODULE_DATA.banatrol.kcal / 100);
    modC += (mBan * MODULE_DATA.banatrol.c / 100);

    const mProt = parseFloat(document.getElementById('modProteinex').value) || 0;
    modK += (mProt * MODULE_DATA.proteinex.kcal / 100);
    modP += (mProt * MODULE_DATA.proteinex.p / 100);

    const mFres = parseFloat(document.getElementById('modFresubin').value) || 0;
    modK += (mFres * MODULE_DATA.fresubin.kcal / 100);
    modP += (mFres * MODULE_DATA.fresubin.p / 100);

    // NEW V3.60: Factor in Oral Intake
    const oralK = parseFloat(document.getElementById('oralKcal').value) || 0;
    const oralP = parseFloat(document.getElementById('oralProt').value) || 0;
    const oralC = parseFloat(document.getElementById('oralCHO').value) || 0;
    const oralL = parseFloat(document.getElementById('oralLip').value) || 0;

    // NEW V3.60: Factor in IV Fluids (Sueroterapia)
    const ivType = document.getElementById('ivType').value;
    const ivVol = parseFloat(document.getElementById('ivVolume').value) || 0;
    let ivK = 0, ivC = 0;

    if (ivType === 'sg5') {
        ivC = ivVol * 0.05;     // 5g per 100ml
        ivK = ivC * 3.4;        // 3.4 kcal per g of IV dextrose
    } else if (ivType === 'sg10') {
        ivC = ivVol * 0.10;     // 10g per 100ml
        ivK = ivC * 3.4;
    }

    // NEW V4.95: Factor in RTH (Ready to Hang) contributions
    let rthK = 0, rthP = 0, rthC = 0, rthL = 0;
    const rthRate = parseFloat(document.getElementById('infusionRate')?.value) || 0;
    const rthId = document.getElementById('infusionRTHSelect')?.value;
    const rthSubtotalWrapper = document.getElementById('rthSubtotalWrapper');
    
    if (rthRate > 0 && rthId) {
        const rthObj = AppState.formulas.find(f => f.id === rthId);
        if (rthObj) {
            const rthVol = rthRate * 24; // Daily volume in ml
            rthK = (rthVol / 100) * rthObj.k;
            rthP = (rthVol / 100) * rthObj.p;
            rthC = (rthVol / 100) * rthObj.c;
            rthL = (rthVol / 100) * rthObj.f;
            
            // Update RTH subtotal board
            const elRthK = document.getElementById('subKcalRth');
            const elRthP = document.getElementById('subProtRth');
            const elRthC = document.getElementById('subCHORth');
            const elRthL = document.getElementById('subLipRth');
            if (elRthK) elRthK.innerText = Math.round(rthK);
            if (elRthP) elRthP.innerText = rthP.toFixed(1);
            if (elRthC) elRthC.innerText = rthC.toFixed(1);
            if (elRthL) elRthL.innerText = rthL.toFixed(1);
            
            if (rthSubtotalWrapper) rthSubtotalWrapper.style.display = 'block';
            
            // Render minerals if panel is open
            if (typeof window.renderRTHMinerals === 'function') {
                window.renderRTHMinerals(rthObj, rthVol);
            }
        }
    } else {
        if (rthSubtotalWrapper) rthSubtotalWrapper.style.display = 'none';
        const panel = document.getElementById('rthMineralsPanel');
        if (panel) panel.style.display = 'none';
    }

    k += (modK + oralK + ivK + rthK);
    p += (modP + oralP + rthP);
    c += (modC + oralC + ivC + rthC);
    l += (modL + oralL + rthL);

    // --- NEW V4.40: Factor in Route Overlap (Traslape) ---
    if (AppState.traslape && AppState.traslape.active) {
        k += (AppState.traslape.sourceKcal || 0);
        p += (AppState.traslape.sourceProt || 0);
        c += (AppState.traslape.sourceCHO || 0);
        l += (AppState.traslape.sourceLip || 0);
    }

    // Calculate total Fiber and HMB
    let totalFibra = 0;
    let totalHMB = 0;
    
    const activeFormulaId = document.getElementById('formulaSelect')?.value;
    const activeFormula = AppState.formulas.find(f => f.id === activeFormulaId);
    if (activeFormula) {
        let grams = 0;
        const vol = activeFormula.isBotellin ? (v1 * activeFormula.volUnit) : v1;
        if (activeFormula.type === 'p') {
            const dil = v2 > 0 ? v2 : (activeFormula.stdDil || 0);
            grams = vol * (dil / 100);
        } else {
            grams = vol;
        }

        if (activeFormula.fibra) {
            totalFibra += activeFormula.fibra * (grams / 100);
        }
        if (activeFormula.hmb) {
            totalHMB += activeFormula.hmb * (grams / 100);
        }
    }

    if (AppState.compareMode) {
        const compareFormulaId = document.getElementById('formulaSelectB')?.value;
        const compareFormula = AppState.formulas.find(f => f.id === compareFormulaId);
        if (compareFormula) {
            let gramsB = 0;
            const volB = compareFormula.isBotellin ? (v1 * compareFormula.volUnit) : v1;
            if (compareFormula.type === 'p') {
                gramsB = volB * (v2B / 100);
            } else {
                gramsB = volB;
            }

            if (compareFormula.fibra) {
                totalFibra += compareFormula.fibra * (gramsB / 100);
            }
            if (compareFormula.hmb) {
                totalHMB += compareFormula.hmb * (gramsB / 100);
            }
        }
    }

    const elFibra = document.getElementById('totalFibra');
    const elHMB = document.getElementById('totalHMB');
    const elAdditionalBox = document.getElementById('additionalAportesBox');

    if (elFibra) elFibra.innerText = totalFibra.toFixed(1);
    if (elHMB) elHMB.innerText = Math.round(totalHMB);

    if (elAdditionalBox) {
        if (totalFibra > 0 || totalHMB > 0) {
            elAdditionalBox.style.display = 'flex';
        } else {
            elAdditionalBox.style.display = 'none';
        }
    }

    // Animation: Count Up Numbers
    animateValue("valKcal", Math.round(k));
    animateValue("valProt", p.toFixed(1));
    animateValue("valCHO", c.toFixed(1));
    animateValue("valLip", l.toFixed(1));
    animateValue("simCurrent", Math.round(k));

    const adeqMode = AppState.adequacyMode || 'goal';
    const theoreticalGET = AppState.patient?.tmt || AppState.patient?.tmt_calculated || parseFloat(document.getElementById('valGET')?.innerText) || 2000;
    const goal = (adeqMode === 'get') ? theoreticalGET : (parseFloat(document.getElementById('goalTotal').value) || theoreticalGET);
    document.getElementById('simBar').style.width = Math.min((k / goal) * 100, 100) + '%';

    // Animation: Stacked Bar (New)
    const totalMacross = p + c + l;
    const barProtEl = document.getElementById('barProt');
    const barCHOEl = document.getElementById('barCHO');
    const barLipEl = document.getElementById('barLip');
    if (barProtEl && barCHOEl && barLipEl) {
        if (totalMacross > 0) {
            const pPct = (p / totalMacross) * 100;
            const cPct = (c / totalMacross) * 100;
            const lPct = (l / totalMacross) * 100;

            barProtEl.style.width = pPct + "%";
            barCHOEl.style.width = cPct + "%";
            barLipEl.style.width = lPct + "%";
        } else {
            barProtEl.style.width = "0%";
            barCHOEl.style.width = "0%";
            barLipEl.style.width = "0%";
        }
    }

    // Compare Mode Updates
    if (AppState.compareMode) {
        updateCompareResults(k, p, c, l);
    }

    // NEW V3.62: Update Adequacy Card
    const adeqCard = document.getElementById('adequacyCard');
    const adeqKcal = document.getElementById('adeqKcal');
    const adeqProt = document.getElementById('adeqProt');
    const adeqCHO = document.getElementById('adeqCHO');
    const adeqLip = document.getElementById('adeqLip');

    // Read goals (grams) from dataset values
    const elP = document.getElementById('goalProt');
    const elC = document.getElementById('goalCHO');
    const elL = document.getElementById('goalLip');

    const goalP = elP ? (parseFloat(elP.dataset.val) || 0) : 0;
    const goalC = elC ? (parseFloat(elC.dataset.val) || 0) : 0;
    const goalL = elL ? (parseFloat(elL.dataset.val) || 0) : 0;

    // Use selected adequacyMode (META vs GET)
    const officialKcalGoal = goal;

    if (adeqCard) {
        // Redefined V4.27: Card is permanent. Values calculated if goals exist.
        adeqCard.style.display = 'block';

        // Kcal Adequacy
        if (officialKcalGoal > 0) {
            const pctK = Math.round((k / officialKcalGoal) * 100);
            adeqKcal.innerText = pctK + "%";
            adeqKcal.style.color = (pctK < 90 || pctK > 110) ? '#e74c3c' : '#27ae60';
        } else { adeqKcal.innerText = "--"; adeqKcal.style.color = '#888'; }

        // Prot Adequacy
        if (goalP > 0) {
            const pctP = Math.round((p / goalP) * 100);
            adeqProt.innerText = pctP + "%";
            adeqProt.style.color = (pctP < 90 || pctP > 110) ? '#e74c3c' : '#27ae60';
        } else { adeqProt.innerText = "--"; adeqProt.style.color = '#888'; }

        // CHO Adequacy
        if (goalC > 0) {
            const pctC = Math.round((c / goalC) * 100);
            adeqCHO.innerText = pctC + "%";
            adeqCHO.style.color = (pctC < 90 || pctC > 110) ? '#e74c3c' : '#27ae60';
        } else { adeqCHO.innerText = "--"; adeqCHO.style.color = '#888'; }

        // Lip Adequacy
        if (goalL > 0) {
            const pctL = Math.round((l / goalL) * 100);
            adeqLip.innerText = pctL + "%";
            adeqLip.style.color = (pctL < 90 || pctL > 110) ? '#e74c3c' : '#27ae60';
        } else { adeqLip.innerText = "--"; adeqLip.style.color = '#888'; }

    }

    // Trigger Infusion Calc update if volume changes
    calcInfusion(true);
    calcHydration();

    // Update Chart
    if (AppState.chart) {
        // Convert to calories for distribution chart (4 kcal/g Prot/CHO, 9 kcal/g Fat)
        const pCal = p * 4;
        const cCal = c * 4;
        const lCal = l * 9;

        AppState.chart.data.datasets[0].data = [pCal, cCal, lCal];
        AppState.chart.update();
    }

    // NEW V3.95: Escáner Proteico (Neonate g/kg/d)
    const proTracker = document.getElementById('proteinTrackerResult');
    if (proTracker) {
        if (AppState.patient.peso > 0 && AppState.patient.type === 'neonate') {
            const pt = p / AppState.patient.peso; // Prot divided by Total Weight in kg
            let ptColor = '#27ae60';
            let ptL = 'Ideal';
            // Neonatal protein brackets
            if (pt < 2.5) { ptColor = '#c0392b'; ptL = '⚠️ Peligro: Déficit Grave'; }
            else if (pt < 3.2) { ptColor = '#f39c12'; ptL = 'Subóptimo'; }
            else if (pt >= 3.2 && pt <= 4.2) { ptColor = '#27ae60'; ptL = 'Rango Crítico (UCIN)'; }
            else if (pt > 4.5) { ptColor = '#c0392b'; ptL = '⚠️ Sobrecarga Renal'; }
            else { ptColor = '#2980b9'; ptL = 'Límite Superior'; }

            proTracker.innerHTML = `
                <div style="margin-top:10px; margin-bottom:10px; background:${ptColor}10; border:2px dashed ${ptColor}; padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:700; color:${ptColor}; font-size:1rem;">
                        🩸 Proteína Diaria: <span style="font-size:1.2rem; font-weight:800;">${pt.toFixed(2)}</span> <span style="font-size:0.8rem;">g/kg/d</span>
                    </div>
                    <div style="background:${ptColor}; color:#fff; font-size:0.7rem; padding:4px 8px; border-radius:6px; font-weight:800;">
                        ${ptL}
                    </div>
                </div>`;
            proTracker.style.display = 'block';
        } else {
            proTracker.style.display = 'none';
        }
    }
    // --- NEW V4.42: Protein Justification (NPC:N Ratio) ---
    const updateProteinJustification = (actualKcal, actualProt) => {
        const goalRatioVal = document.getElementById('ratioGoalVal');
        const goalRatioDiag = document.getElementById('ratioGoalDiag');
        const actualRatioVal = document.getElementById('ratioActualVal');
        const actualRatioDiag = document.getElementById('ratioActualDiag');

        if (!actualRatioVal || !goalRatioVal) return;

        const pA = AppState.patient || {};
        const isPed = (pA.type === 'pediatric' || pA.type === 'neonate' || (pA.ageParts && pA.ageParts.y < 18));

        const getNPCDiagnosis = (ratio, isPed) => {
            if (isPed) {
                if (ratio < 90) return '⚠️ ¡Demasiada Proteína! (Riesgo Renal)';
                if (ratio <= 150) return '✅ ¡Perfecto para Crecimiento Rápido!';
                if (ratio <= 200) return '💡 Mantenimiento (Sube prote si quieres anabolismo)';
                return '⚠️ ¡Faltan Proteínas urgentemente! (Riesgo Nutricional)';
            } else {
                if (ratio < 100) return '✅ Fórmula apta para Estrés Severo (UCI)';
                if (ratio <= 130) return '✅ Fórmula apta para Estrés Moderado';
                if (ratio <= 180) return '✅ Mantenimiento (Normal)';
                return '⚠️ ¡Falta Proteína! (Exceso de Energía / Lipogénesis)';
            }
        };

        // --- 1. Evaluate GOAL ---
        const goalTotal = parseFloat(document.getElementById('goalTotal')?.value) || 0;
        const goalP = parseFloat(document.getElementById('goalProt')?.dataset.val) || 0;

        if (goalTotal > 0 && goalP > 0) {
            const goalN = goalP / 6.25;
            const goalNPC = goalTotal - (goalP * 4);
            const goalRatio = goalNPC / goalN;
            goalRatioVal.innerText = `${Math.round(goalRatio)}:1`;
            goalRatioDiag.innerText = getNPCDiagnosis(goalRatio, isPed);
        } else {
            goalRatioVal.innerText = '-- : 1';
            goalRatioDiag.innerText = 'Faltan metas';
        }

        // --- 2. Evaluate ACTUAL ---
        if (actualKcal > 0 && actualProt > 0) {
            const actN = actualProt / 6.25;
            const actNPC = actualKcal - (actualProt * 4);
            const actRatio = actNPC / actN;
            actualRatioVal.innerText = `${Math.round(actRatio)}:1`;
            actualRatioDiag.innerText = getNPCDiagnosis(actRatio, isPed);

            if (actRatio < 90) actualRatioVal.style.color = '#e74c3c';
            else if (actRatio <= 150) actualRatioVal.style.color = '#27ae60';
            else if (actRatio <= 200) actualRatioVal.style.color = '#3498db';
            else actualRatioVal.style.color = '#f39c12';

        } else {
            actualRatioVal.innerText = '-- : 1';
            actualRatioDiag.innerText = 'Sin simulación';
        }
    };

    updateProteinJustification(k, p);
    renderMinerals();

    // --- FINAL V4.25: Global update for Adequacy Strategy ---
    if (typeof window.updatePrescriptionStrategy === 'function') window.updatePrescriptionStrategy(k);
}

// --- 10. INFUSION CALCULATOR LOGIC (NEW) ---
function initInfusionLogic() {
    // Populate RTH Selector
    const rthSel = document.getElementById('infusionRTHSelect');
    if (rthSel) {
        let html = '<option value="">-- No usar fórmula RTH --</option>';
        LOCAL_FORMULAS.filter(f => f.cat.includes("RTH")).forEach(f => {
            html += `<option value="${f.id}">${f.name}</option>`;
        });
        rthSel.innerHTML = html;
    }

    // --- NEW V4.20: Population-aware Infusion Proposals ---
    window.updateInfusionProposal = () => {
        const p = AppState.patient || {};
        const label = document.getElementById('infusionSuggestionLabel');
        if (!label) return;
        const isPeds = p.type === 'pediatric' || p.type === 'neonate';
        const limit = isPeds ? 250 : 80;
        label.innerText = `Sug: ${limit}`;
        label.dataset.suggestion = limit;
        label.style.borderColor = isPeds ? '#9b59b6' : '#3498db';
        label.style.color = isPeds ? '#9b59b6' : '#3498db';
    };

    window.applyInfusionSuggestion = () => {
        const label = document.getElementById('infusionSuggestionLabel');
        const input = document.getElementById('infusionRate');
        if (label && input) {
            input.value = label.dataset.suggestion || 80;
            window.calcInfusion();
        }
    };

    // Bind inputs to global scope since we referenced it inline
    window.calcInfusion = function (skipSim) {
        // We listen to the main prescribed volume! 
        const totalVolPrescrito = window.getEffectiveSimulationVolume();
        const selectedRthId = document.getElementById('infusionRTHSelect')?.value;

        // If no RTH is selected, clear rate and start time
        if (!selectedRthId) {
            const rateInput = document.getElementById('infusionRate');
            if (rateInput) rateInput.value = '';
            const startInput = document.getElementById('infusionStart');
            if (startInput) startInput.value = '';
        }

        const rate = parseFloat(document.getElementById('infusionRate').value) || 0;
        const sachetStartStr = document.getElementById('infusionStart')?.value;

        const resBox = document.getElementById('infusionResultBox');
        const logBox = document.getElementById('valLogisticsBox');
        const valEnd = document.getElementById('valEndTime');
        const valDur = document.getElementById('valDuration');

        if (totalVolPrescrito <= 0 && rate <= 0) {
            resBox.style.display = 'none';
            if (logBox) logBox.style.display = 'none';
            if (!skipSim && typeof window.runSimulation === 'function') {
                window.runSimulation();
            }
            return;
        }

        const p = AppState.patient || {};
        const isPeds = p.type === 'pediatric' || p.type === 'neonate';
        const limit = isPeds ? 250 : 80;

        // --- 1. Sachet Terminate Calculation ---
        let sachetEndStrDisplay = '--:--';
        let sachetDurDisplay = '';
        let sachetEndDate = null;
        let rthObj = null;

        if (selectedRthId) {
            rthObj = LOCAL_FORMULAS.find(f => f.id === selectedRthId);
        }

        if (rate > 0 && sachetStartStr) {
            resBox.style.display = 'flex';

            let volToPass = totalVolPrescrito;
            if (rthObj) volToPass = rthObj.volBase || 1000;

            const durationHrs = volToPass / rate;
            const [startH, startM] = sachetStartStr.split(':').map(Number);
            const now = new Date();
            now.setHours(startH, startM, 0, 0);

            const endTimestamp = now.getTime() + (durationHrs * 3600 * 1000);
            sachetEndDate = new Date(endTimestamp);

            const endH = sachetEndDate.getHours().toString().padStart(2, '0');
            const endM = sachetEndDate.getMinutes().toString().padStart(2, '0');

            const startDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endDateOnly = new Date(sachetEndDate.getFullYear(), sachetEndDate.getMonth(), sachetEndDate.getDate());
            const diffDays = Math.round((endDateOnly - startDateOnly) / (1000 * 60 * 60 * 24));

            const endDD = sachetEndDate.getDate().toString().padStart(2, '0');
            const endMM = (sachetEndDate.getMonth() + 1).toString().padStart(2, '0');
            const dateStr = `${endDD}/${endMM}`;

            let dayLabel = "";
            if (diffDays === 0) {
                dayLabel = ` (Hoy ${dateStr})`;
            } else if (diffDays === 1) {
                dayLabel = ` (Mañana ${dateStr})`;
            } else {
                dayLabel = ` (${dateStr})`;
            }

            sachetEndStrDisplay = `${endH}:${endM}${dayLabel}`;
            const hrs = Math.floor(durationHrs);
            const mins = Math.round((durationHrs - hrs) * 60);
            sachetDurDisplay = `(${hrs}h ${mins}m)`;
        } else if (rthObj && totalVolPrescrito > 0) {
            resBox.style.display = 'flex';
        } else {
            resBox.style.display = 'none';
        }

        valEnd.innerText = sachetEndStrDisplay;
        valDur.innerText = sachetDurDisplay;

        // --- 2. SEDILE CEFE Logistics Recommendation ---
        const calcTotalVol = totalVolPrescrito > 0 ? totalVolPrescrito : (rate * 24);

        if (calcTotalVol > 0 && rate > 0) {
            const bottleVol = rthObj?.volBase || 1000;
            const envasesNedded = Math.ceil(calcTotalVol / bottleVol);

            let currentSachetWarningStr = '';
            if (sachetEndDate) {
                const hourEnds = sachetEndDate.getHours();
                if (hourEnds >= 18 || hourEnds < 8) {
                    currentSachetWarningStr = `<div style="margin-top:6px; color:#c0392b;">⚠️ <b>Riesgo Quiebre Nocturno:</b> El RTH actual acaba a las ${sachetEndDate.getHours().toString().padStart(2, '0')}:${sachetEndDate.getMinutes().toString().padStart(2, '0')}. Analiza garantizar el stock de reemplazo hoy a las 18:00.</div>`;
                }
            }

            let cycleStr = '';
            let planesText = `<span style="opacity:0.8; font-style:italic;">(Ingresa una 'Hora de Instalación' y una 'Velocidad' para calcular la logística SEDILE de 24 hrs)</span>`;

            if (sachetStartStr && rate > 0) {
                const [cH, cM] = sachetStartStr.split(':').map(Number);
                const cycleDurHrs = totalVolPrescrito / rate;

                if (!isNaN(cycleDurHrs) && isFinite(cycleDurHrs)) {
                    const cNow = new Date();
                    cNow.setHours(cH, cM, 0, 0);
                    const cEndDate = new Date(cNow.getTime() + (cycleDurHrs * 3600 * 1000));
                    cycleStr = ` | Fin Ciclo 24H: <b style="color:var(--primary);">${cEndDate.getHours().toString().padStart(2, '0')}:${cEndDate.getMinutes().toString().padStart(2, '0')}</b>`;
                }

                // SECRETO LOGISTICO SEDILE: Calcular splits 14h / 18h
                let count14 = 0;
                let count18 = 0;

                const cycleStartDecimal = cH + (cM / 60);
                const bottleDuration = bottleVol / rate;

                for (let i = 0; i < envasesNedded; i++) {
                    const connectTime = (cycleStartDecimal + (i * bottleDuration)) % 24;
                    // SEDILE Safe Window (margen orgánico prep.): 
                    // Si se instala tarde (15:00 a 17:59) -> cabe para pedir a las 14:00 (hoy)
                    // Si se instala en cualquier otro horario -> pedir a las 18:00
                    if (connectTime >= 15 && connectTime < 18) {
                        count14++;
                    } else {
                        count18++;
                    }
                }

                planesText = `
                    <div style="margin-top:5px; background:rgba(255,255,255,0.7); padding:4px 8px; border-radius:5px; border-left:3px solid #27ae60;">
                        <b style="color:#27ae60; font-size:0.75rem;">&#128203; Plan de Repartos SEDILE (${envasesNedded} en total):</b><br>
                        &bull; En el reparto de las 14:00 hrs: Pedir <b>${count14}</b> producto(s).<br>
                        &bull; En el reparto de las 18:00 hrs: Pedir <b>${count18}</b> producto(s).
                    </div>
                `;
            }

            const fallbackName = rthObj ? rthObj.name : "Fórmula (" + bottleVol + "ml)";
            logBox.style.display = 'block';
            logBox.innerHTML = `
                <div style="font-size:0.8rem; margin-bottom:4px; color:#555;">📊 Pauta 24hrs: <b>${calcTotalVol} ml</b> ${cycleStr}</div>
                <div style="border-top:1px dashed #f1c40f; margin:5px 0;"></div>
                📦 Necesitas <b>${envasesNedded} producto(s) RTH diarios</b> de ${fallbackName}.<br>
                ${planesText}
                ${currentSachetWarningStr}
                ${rate > limit ? `<div style="margin-top:6px; color:#e74c3c; font-weight:700; background:rgba(231,76,60,0.1); padding:5px; border-radius:4px; border:1px solid rgba(231,76,60,0.3);">⚠️ Alerta Velocidad: Estás superando el límite clínico sugerido (${limit} ml/hr) para esta población.</div>` : ''}
            `;
        } else {
            logBox.style.display = 'none';
        }
        if (!skipSim && typeof window.runSimulation === 'function') {
            window.runSimulation();
        }
    };

    // Add volume listener so it triggers the calculator dynamically
    const volInput = document.getElementById('volume');
    if (volInput) {
        volInput.addEventListener('input', () => { if (typeof window.calcInfusion === 'function') window.calcInfusion(); });
    }
}

// --- 11. HYDRATION LOGIC (NEW) ---
function initHydrationLogic() {
    // Listener for factor input
    const factorInput = document.getElementById('hydFactor');
    if (factorInput) factorInput.oninput = calcHydration;
}

function toggleHydMethod() {
    const isMlKg = document.querySelector('input[name="hydMethod"][value="mlkg"]').checked;
    document.getElementById('hydFactorRow').style.display = isMlKg ? 'block' : 'none';
    calcHydration();
}

function clearAllInputsForMode(mode) {
    AppState.patient = { 
        id: null, 
        nombre: '', 
        edad: 0, 
        sexo: 'm', 
        peso: 0, 
        estatura: 0, 
        actividad: 1.2, 
        bmi: 0, 
        tmt: 0, 
        ia_report: null, 
        type: mode,
        weight_history: [],
        anamnesis: {},
        strongkids: {},
        nrs2002: { initialAnswers: {} }
    };
    AppState.userOverridesGoal = false;

    const idsToClear = [
        'nombre', 'num_ficha', 'antecedentes_morbidos', 'riesgo_lpp', 'fecha_ingreso_servicio', 'observaciones_generales', 'edad', 'peso', 'estatura', 'diagnostico', 'cama',
        'formulaSearch', 'formulaSelect', 'volume', 'dilution',
        'modNessucar', 'modMCT', 'modEnterex', 'modBanatrol', 'modProteinex', 'modFresubin',
        'oralKcal', 'oralProt', 'oralCHO', 'oralLip', 'oralWater',
        'ivType', 'ivVolume',
        'ccintura', 'cbraquial', 'cpantorrilla', 'altrodilla',
        'ptricipital', 'pbicipital', 'piliaco', 'pabdominal',
        'mediaenv', 'envcomp', 'edemaGrade', 'diagPES', 'diagnosticoPES',
        'residuo', 'diarrea', 'distension', 'accesoTipo', 'accesoFecha',
        'goalProtKg', 'goalCHOKg', 'goalLipKg', 'valNUU', 'valNFactor',
        'altrodilla', 'cpantorrilla', 'pcefalico', 'gestacional_nacimiento_semanas', 
        'gestacional_nacimiento_dias'
    ];

    const patDM = document.getElementById('patologia_dm');
    if (patDM) patDM.checked = false;
    const patHTA = document.getElementById('patologia_hta');
    if (patHTA) patHTA.checked = false;
    const patERC = document.getElementById('patologia_erc');
    if (patERC) patERC.checked = false;
    
    idsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'SELECT') {
                if (id === 'sexo') el.value = 'm';
                else if (id === 'actividad') el.value = '1.2';
                else if (id === 'edemaGrade') el.value = '0';
                else if (id === 'ivType') el.value = 'none';
                else el.selectedIndex = 0;
            } else {
                el.value = '';
            }
        }
    });

    const clinicalCheckboxes = document.querySelectorAll('.grid-col-2 input[type="checkbox"], .grid-col-3 input[type="checkbox"]');
    clinicalCheckboxes.forEach(chk => chk.checked = false);

    const activeButtons = document.querySelectorAll('.history-btn.active');
    activeButtons.forEach(btn => btn.classList.remove('active'));

    const badges = [
        'valBMI', 'resTMB', 'valIdealWeight', 'valIPT', 'valIPTClass', 
        'simGoal', 'simCurrent', 'valKcal', 'valProt', 'valCHO', 'valLip',
        'lblCBStatus', 'lblAMBStatus', 'lblAGBStatus', 'valRossStatureBadge', 
        'valChumleaWeightBadge', 'resFactorial', 'resBN', 'growthVelocityResult'
    ];
    badges.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'simGoal' || id === 'simCurrent') {
                el.innerText = '0';
            } else {
                el.innerText = '--';
            }
        }
    });

    const indicator = document.getElementById('anthIndicator');
    if (indicator) indicator.style.left = '50%';

    const badgeDate = document.getElementById('valAnthDate');
    if (badgeDate) badgeDate.innerText = 'Última act: --';

    const examsContainer = document.getElementById('examsContainer');
    if (examsContainer) examsContainer.innerHTML = '';

    const iaResult = document.getElementById('iaResultContainer');
    if (iaResult) iaResult.innerHTML = '';
    const iaInitial = document.getElementById('iaInitialState');
    if (iaInitial) iaInitial.style.display = 'block';

    updateFormulaSelect();
    runSimulation();
}

async function resetPatientForm(skipConfirm = false, silent = false) {
    const nombreVal = document.getElementById('nombre')?.value || '';
    if (!skipConfirm) {
        if (!confirm("¿Deseas limpiar todos los campos para un nuevo paciente?")) return;

        if (nombreVal.trim() !== '') {
            showToast("💾 Guardando paciente actual en historial...");
            await window.saveCurrentPatient(true);
        }
    }

    // Reset Global State
    AppState.patient = { id: null, nombre: '', edad: 0, sexo: 'm', peso: 0, estatura: 0, actividad: 1.2, bmi: 0, tmt: 0, ia_report: null, weight_history: [] };
    AppState.userOverridesGoal = false;

    // 1. Dashboard Inputs
    const dashIds = ['nombre', 'num_ficha', 'antecedentes_morbidos', 'edad', 'sexo', 'peso', 'estatura', 'diagnostico', 'cama', 'actividad', 'goalTotal', 'goalKcalBox'];
    dashIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id === 'actividad') ? '1.2' : (id === 'sexo' ? 'm' : '');
    });

    // 2. Simulator Inputs
    const simIds = [
        'formulaSearch', 'formulaSelect', 'volume', 'dilution',
        'modNessucar', 'modMCT', 'modEnterex', 'modBanatrol', 'modProteinex', 'modFresubin',
        'oralKcal', 'oralProt', 'oralCHO', 'oralLip', 'oralWater',
        'ivType', 'ivVolume', 'goalTotal'
    ];
    simIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const ivTypeEl = document.getElementById('ivType');
    if (ivTypeEl) ivTypeEl.value = 'none';

    // 3. Assessment Inputs
    const assessIds = [
        'ccintura', 'cbraquial', 'cpantorrilla', 'altrodilla',
        'ptricipital', 'pbicipital', 'piliaco', 'pabdominal',
        'mediaenv', 'envcomp', 'edemaGrade', 'diagPES', 'diagnosticoPES',
        'residuo', 'diarrea', 'distension', 'accesoTipo', 'accesoFecha',
        'goalProtKg', 'goalCHOKg', 'goalLipKg'
    ];
    assessIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id === 'edemaGrade') ? '0' : '';
    });

    // 4. Clear Dynamic UI
    const containers = ['examsContainer', 'iaResultContainer', 'rossContainer', 'frisanchoContainer'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '';
            el.style.display = 'none';
        }
    });

    const noteContainer = document.getElementById('clinicalNoteContainer');
    if (noteContainer) {
        noteContainer.style.display = 'none';
        const noteContent = document.getElementById('noteContent');
        if (noteContent) noteContent.innerText = '';
    }

    // 5. Nutri IA State
    const iaInitial = document.getElementById('iaInitialState');
    if (iaInitial) iaInitial.style.display = 'block';

    // 6. Reset Badges
    const badges = ['valBMI', 'resTMB', 'valIdealWeight', 'valIPT', 'valIPTClass', 'simGoal', 'simCurrent', 'valKcal', 'valProt', 'valCHO', 'valLip'];
    badges.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = (id.includes('val') || id.includes('res')) ? '--' : '0';
    });

    // Update Display
    const patientBadge = document.getElementById('currentPatientName');
    if (patientBadge) patientBadge.innerText = 'Nuevo Paciente';

    updateFormulaSelect();
    runSimulation();
    if (!silent) {
        showToast("✨ Formulario reseteado para nuevo paciente");
    }
}

function calcHydration() {
    const p = AppState.patient;
    const vol = window.getEffectiveSimulationVolume();
    const dil = (parseFloat(document.getElementById('dilution')?.value) || 100) / 100;
    let realVol = vol * dil; // Effective volume from formula

    // NEW V3.60: Add Oral Water and IV Volume to Real Volume
    const oralWater = parseFloat(document.getElementById('oralWater')?.value) || 0;
    const ivVol = parseFloat(document.getElementById('ivVolume')?.value) || 0;

    realVol += oralWater + ivVol;

    if (p.peso <= 0) return;

    let req = 0;
    const isMlKgRadio = document.querySelector('input[name="hydMethod"][value="mlkg"]');
    const isMlKg = isMlKgRadio ? isMlKgRadio.checked : true;

    if (isMlKg) {
        const factor = parseFloat(document.getElementById('hydFactor')?.value) || 0;
        req = p.peso * factor;
    } else {
        if (p.peso <= 10) req = p.peso * 100;
        else if (p.peso <= 20) req = 1000 + (p.peso - 10) * 50;
        else req = 1500 + (p.peso - 20) * 20;
    }

    // 1. Requerimiento Base
    document.getElementById('hydReq').innerText = Math.round(req);

    // 2. Clinical Metrics V3.12
    const currentKcal = parseFloat(document.getElementById('valKcal')?.innerText) || 0;

    // Ingreso Actual
    const elTotal = document.getElementById('valHydTotal');
    if (elTotal) elTotal.innerText = `${Math.round(realVol)} ml`;

    // Relación ml/kcal
    const elRatio = document.getElementById('valHydRatio');
    if (elRatio && currentKcal > 0) {
        elRatio.innerText = (realVol / currentKcal).toFixed(2);
    }

    // Balance Estimado
    const elBalance = document.getElementById('valHydBalance');
    const balance = Math.round(realVol - req);
    if (elBalance) {
        elBalance.innerText = `${balance > 0 ? '+' : ''}${balance} ml`;
        elBalance.style.color = balance < -50 ? '#e67e22' : (balance > 50 ? '#3498db' : '#27ae60');
    }

    // 3. Water Bar
    const bar = document.getElementById('hydBar');
    const pct = Math.min((realVol / req) * 100, 100);
    bar.style.width = pct + "%";
    bar.style.background = (pct < 80) ? "#e67e22" : (pct > 105) ? "#3498db" : "#27ae60";
}

// --- 12. COMPARE LOGIC (NEW) ---
function initCompareLogic() {
    const btnComp = document.getElementById('btnToggleCompare');
    const rowComp = document.getElementById('compareRow');
    const selB = document.getElementById('formulaSelectB');

    // Clone options from main select to secondary
    setTimeout(() => {
        selB.innerHTML = document.getElementById('formulaSelect').innerHTML;
        if (typeof renderFormulaBInputs === 'function') {
            renderFormulaBInputs();
        }
    }, 1000); // Wait for main init

    btnComp.onclick = () => {
        AppState.compareMode = !AppState.compareMode;
        rowComp.style.display = AppState.compareMode ? 'block' : 'none';
        btnComp.classList.toggle('active');
        runSimulation();
    };

    selB.onchange = () => {
        if (typeof renderFormulaBInputs === 'function') {
            renderFormulaBInputs();
        }
        runSimulation();
    };
    const dilBSelect = document.getElementById('dilutionBSelect');
    if (dilBSelect) {
        dilBSelect.onchange = () => {
            const baseDilBInput = document.getElementById('dilutionB');
            if (baseDilBInput) {
                baseDilBInput.value = dilBSelect.value;
                runSimulation();
            }
        };
    }
}

// Duplicate function at line 928 removed in V3.30

// Simple CountUp Animation
function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;

    const start = parseFloat(obj.innerText) || 0;
    const endVal = parseFloat(end) || 0;

    if (start === endVal) return;

    // If change is drastic or first load, maybe faster?
    const duration = 600;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // EaseOutQuart

        const current = start + (endVal - start) * ease;

        if (Number.isInteger(endVal)) {
            obj.innerText = Math.round(current);
        } else {
            obj.innerText = current.toFixed(1);
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            obj.innerText = end;
        }
    }
    requestAnimationFrame(update);
}

async function savePrescription() {
    if (!AppState.user || !AppState.user.id) {
        alert("⚠️ Error: Sesión de usuario no válida.");
        return;
    }

    const btn = document.getElementById('btnSaveHistory');
    const { error } = await supabaseClient.from('prescripciones').insert([{
        paciente_nombre: document.getElementById('nombre').value || 'Anónimo',
        detalle: `Kcal: ${document.getElementById('valKcal').innerText}, Prot: ${document.getElementById('valProt').innerText}`,
        user_id: AppState.user.id
    }]);
    btn.innerText = error ? "Error" : "¡Prescripción Guardada!";
    setTimeout(() => btn.innerText = "Prescribir y Guardar Cloud", 2000);
}

// --- 9. PWA LOGIC ---
let deferredPrompt;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registrado', reg))
            .catch(err => console.log('SW error', err));
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const container = document.getElementById('pwaInstallContainer');
    if (container) container.style.display = 'block';
});

document.getElementById('btnInstallApp').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('User response:', outcome);
    deferredPrompt = null;
    document.getElementById('pwaInstallContainer').style.display = 'none';
});
// --- 13. SMART SEARCH LOGIC (NEW) ---
function initSearchLogic() {
    attachSearch('formulaSearch', 'formulaSelect');
    attachSearch('compareSearch', 'formulaSelectB');
}

function attachSearch(inputId, selectId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const select = document.getElementById(selectId);
        if (!select) return;

        if (term === '') {
            updateFormulaSelect(); // Restore all options if search is cleared
            return;
        }

        const allOptions = AppState.formulas;
        const filtered = allOptions.filter(f => f.name.toLowerCase().includes(term));

        select.innerHTML = '';
        if (filtered.length === 0) {
            select.innerHTML = '<option>Sin resultados</option>';
            return;
        }

        const cats = {};
        filtered.forEach(f => {
            if (!cats[f.cat]) cats[f.cat] = [];
            cats[f.cat].push(f);
        });

        for (const [catName, formulas] of Object.entries(cats)) {
            const grp = document.createElement('optgroup');
            grp.label = catName;
            formulas.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.id;
                const star = AppState.favorites.includes(f.id) ? '⭐ ' : '';
                opt.innerText = star + f.name;
                grp.appendChild(opt);
            });
            select.appendChild(grp);
        }
    });
}

// --- 13.1 Update Formula Select (V3.62) ---
// Removing inline version of this hook, we already have updateFormulaSelect and updateFormulaSelect2

// --- 13.9 Custom Floating Tooltip (NEW) ---
function showExternalTooltip(context) {
    const { chart, tooltip } = context;
    let tooltipEl = document.getElementById('chartjs-external-tooltip');
    
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-external-tooltip';
        tooltipEl.style.background = 'rgba(15, 23, 42, 0.95)';
        tooltipEl.style.borderRadius = '8px';
        tooltipEl.style.color = 'white';
        tooltipEl.style.opacity = 0;
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.transform = 'translate(-50%, -100%)';
        tooltipEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        tooltipEl.style.padding = '8px 12px';
        tooltipEl.style.fontSize = '11px';
        tooltipEl.style.fontFamily = 'Inter, sans-serif';
        tooltipEl.style.zIndex = '999999';
        tooltipEl.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)';
        tooltipEl.style.whiteSpace = 'nowrap';
        document.body.appendChild(tooltipEl);
    }
    
    if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }
    
    if (tooltip.body) {
        const bodyLines = tooltip.body.map(b => b.lines);
        let innerHtml = '';
        
        bodyLines.forEach((body, i) => {
            const colors = tooltip.labelColors[i];
            const color = colors ? colors.backgroundColor : '#333';
            const text = Array.isArray(body) ? body.join(', ') : body;
            const indicator = `<span style="display:inline-block; width:8px; height:8px; background:${color}; border-radius:50%; margin-right:6px;"></span>`;
            innerHtml += `<div style="display:flex; align-items:center; font-weight:600; font-size:11px;">${indicator}${text}</div>`;
        });
        
        tooltipEl.innerHTML = innerHtml;
    }
    
    const rect = chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = (rect.left + window.pageXOffset + tooltip.caretX) + 'px';
    tooltipEl.style.top = (rect.top + window.pageYOffset + tooltip.caretY - 8) + 'px';
}

// --- 14. CHART LOGIC (NEW) ---
function initChartSim() {
    const ctx = document.getElementById('macroChart')?.getContext('2d');
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
        console.warn("📊 Chart.js not loaded yet or blocked. Skipping chart init.");
        return;
    }
    AppState.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Prot', 'Carb', 'Líp'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#e74c3c', // Red (Proteins)
                    '#3498db', // Blue (CHO)
                    '#f1c40f'  // Yellow (Lipids)
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%', // slightly thicker to fit text
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: showExternalTooltip,
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let total = context.chart._metasets[context.datasetIndex].total;
                            let percentage = Math.round((value / total) * 100) + '%';
                            return label + ': ' + percentage;
                        }
                    }
                },
                // Require chartjs-plugin-datalabels
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 10 },
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => {
                            sum += data;
                        });
                        let percentage = (value * 100 / sum).toFixed(0) + "%";
                        return value > 0 ? percentage : '';
                    }
                }
            }
        }
    });
}

function updateCompareResults(k1, p1, c1, l1) {
    const box = document.getElementById('compareResult');
    const macroBox = document.getElementById('compareMacros');
    if (!box || !AppState.compareMode) return;

    const fIdB = document.getElementById('formulaSelectB').value;
    const formulaB = AppState.formulas.find(f => f.id === fIdB);

    if (!formulaB) {
        if (box) box.innerHTML = '';
        if (macroBox) macroBox.innerHTML = '';
        // Hide formula B specific macro board if it exists
        const boardB = document.getElementById('macroBoardB');
        if (boardB) boardB.style.display = 'none';
        return;
    }

    const v1 = window.getEffectiveSimulationVolume();
    const v2 = parseFloat(document.getElementById('dilution').value) || 0;
    const dilBInput = document.getElementById('dilutionB');
    const v2B = dilBInput && dilBInput.value !== "" ? parseFloat(dilBInput.value) : v2;

    let k2 = 0, p2 = 0, c2 = 0, l2 = 0;

    const volB = formulaB.isBotellin ? (v1 * formulaB.volUnit) : v1;
    if (formulaB.type === 'recipe') {
        formulaB.recipe.forEach(rec => {
            const grams = volB * (rec.defPct / 100);
            k2 += rec.k * (grams / 100);
            p2 += rec.p * (grams / 100);
            c2 += rec.c * (grams / 100);
            l2 += rec.f * (grams / 100);
        });
    } else if (formulaB.type === 'p') {
        const dil = v2B > 0 ? v2B : (formulaB.stdDil || 0);
        const grams = volB * (dil / 100);
        k2 = formulaB.k * (grams / 100);
        p2 = formulaB.p * (grams / 100);
        c2 = formulaB.c * (grams / 100);
        l2 = formulaB.f * (grams / 100);
    } else {
        let scl = 1;
        if (formulaB.stdDil && v2B > 0) scl = v2B / formulaB.stdDil;
        k2 = formulaB.k * (volB / 100) * scl;
        p2 = formulaB.p * (volB / 100) * scl;
        c2 = formulaB.c * (volB / 100) * scl;
        l2 = formulaB.f * (volB / 100) * scl;
    }

    // Update Formula B Macro Board (shown below the comparison bar)
    const boardB = document.getElementById('macroBoardB');
    if (boardB) {
        boardB.style.display = 'grid';
        const labelB = document.getElementById('lblFormulaB');
        if (labelB) labelB.innerText = `Fórmula B: ${formulaB.name}`;

        // Factor in Modules V3.50
        let modK = 0, modP = 0, modC = 0, modL = 0;

        const mNess = parseFloat(document.getElementById('modNessucar').value) || 0;
        modK += (mNess * MODULE_DATA.nessucar.kcal / 100);
        modC += (mNess * MODULE_DATA.nessucar.c / 100);

        const mMCT = parseFloat(document.getElementById('modMCT').value) || 0;
        modK += (mMCT * MODULE_DATA.mct.kcal / 100);
        modL += (mMCT * MODULE_DATA.mct.f / 100);

        const mEnt = parseFloat(document.getElementById('modEnterex').value) || 0;
        modK += (mEnt * MODULE_DATA.enterex.kcal / 100);
        modC += (mEnt * MODULE_DATA.enterex.c / 100);

        const mBan = parseFloat(document.getElementById('modBanatrol').value) || 0;
        modK += (mBan * MODULE_DATA.banatrol.kcal / 100);
        modC += (mBan * MODULE_DATA.banatrol.c / 100);

        const mProt = parseFloat(document.getElementById('modProteinex').value) || 0;
        modK += (mProt * MODULE_DATA.proteinex.kcal / 100);
        modP += (mProt * MODULE_DATA.proteinex.p / 100);

        const mFres = parseFloat(document.getElementById('modFresubin').value) || 0;
        modK += (mFres * MODULE_DATA.fresubin.kcal / 100);
        modP += (mFres * MODULE_DATA.fresubin.p / 100);

        // Primary formula A already has modules added in runSimulation
        // But if we want to update the text labels again here:
        document.getElementById('valKcal').innerText = Math.round(k1);
        document.getElementById('valProt').innerText = p1.toFixed(1);
        document.getElementById('valCHO').innerText = c1.toFixed(1);
        document.getElementById('valLip').innerText = l1.toFixed(1);

        // FORMULA B Board Update
        // Calculate B macros + same modules (since modules are added to the 'preparación')
        k2 += modK; p2 += modP; c2 += modC; l2 += modL;

        document.getElementById('valKcalB').innerText = Math.round(k2);
        document.getElementById('valProtB').innerText = p2.toFixed(1);
        document.getElementById('valCHOB').innerText = c2.toFixed(1);
        document.getElementById('valLipB').innerText = l2.toFixed(1);
    }

    // --- differences ---
    renderMinerals();
    const diffK = Math.round(k2 - k1);
    const getBadge = (val, unit) => {
        const isPos = parseFloat(val) >= 0;
        const sign = isPos ? '+' : '';
        return `<span class="diff-badge ${isPos ? 'diff-pos' : 'diff-neg'}">${sign}${val}${unit}</span>`;
    };

    // User wants ONLY the "Vs:" part here
    box.innerHTML = `<div><b>Vs:</b> ${getBadge(diffK, ' kcal')}</div>`;

    // Update Secondary Stack Bar
    const stackSec = document.getElementById('stackCompare');
    if (stackSec) {
        stackSec.style.display = 'flex';
        setTimeout(() => { stackSec.style.opacity = '0.6'; stackSec.style.transform = 'translateY(18px)'; }, 50);

        // Distribution
        // c2 and l2 are already calculated correctly above, no need to redefine them with the broken logic.
        // We will just use the existing c2 and l2 variables.

        const calP = p2 * 4;
        const calC = c2 * 4;
        const calL = l2 * 9;
        const totalCal = calP + calC + calL || 1;

        document.getElementById('barProtB').style.width = (calP / totalCal * 100) + "%";
        document.getElementById('barCHOB').style.width = (calC / totalCal * 100) + "%";
        document.getElementById('barLipB').style.width = (calL / totalCal * 100) + "%";
    }
}

function initAssessmentLogic() {
    // Elements for Strategic Feedback (Scoped or accessed via DOM to avoid ReferenceErrors)
    const resEvoBadge = document.getElementById('evolutionResult');
    const lastGoalLabel = document.getElementById('valLastGoalDate');

    // Name Sync
    const nameInput = document.getElementById('nombre');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            const val = e.target.value;
            const patientBadge = document.getElementById('currentPatientName');
            if (patientBadge) patientBadge.innerText = val || 'Nuevo Paciente';
        });
    }

    // --- NEW V4.40: Route Overlap (Traslape) Control ---
    // Initialize AppState.traslape if not exists
    if (!AppState.traslape) AppState.traslape = { active: false, mode: 'np-ne', sourceKcal: 0, sourceProt: 0, sourceCHO: 0, sourceLip: 0 };

    window.setTraslapeMode = (mode) => {
        AppState.traslape.mode = mode;
        const label = document.getElementById('traslapeLabel');
        const btnNPNE = document.getElementById('btnModeNPNE');
        const btnNEVO = document.getElementById('btnModeNEVO');

        if (label) {
            label.innerText = mode === 'np-ne' ? 'Aporte de Vía de Salida (NP):' : 'Aporte de Vía de Salida (NE):';
        }

        if (btnNPNE && btnNEVO) {
            if (mode === 'np-ne') {
                btnNPNE.style.background = '#e67e22'; btnNPNE.style.color = 'white';
                btnNEVO.style.background = 'transparent'; btnNEVO.style.color = '#666';
            } else {
                btnNEVO.style.background = '#e67e22'; btnNEVO.style.color = 'white';
                btnNPNE.style.background = 'transparent'; btnNPNE.style.color = '#666';
            }
        }
        window.updateTraslapeConfig();
    };

    window.updateTraslapeConfig = () => {
        const inputPct = parseFloat(document.getElementById('trasPercentage')?.value) || 0;
        const mainPctEl = document.getElementById('traslapeMainPct');
        const breakdownPanel = document.getElementById('traslapeMacroBreakdown');
        const breakdownOut = document.getElementById('trasBreakdownOut');
        const breakdownMain = document.getElementById('trasBreakdownMain');

        let pct = inputPct;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;

        if (mainPctEl) mainPctEl.innerText = (100 - pct) + '%';

        // Use active macro goal dataset values (the baseline requirement)
        const goalTotal = parseFloat(document.getElementById('goalTotal')?.value) || 0;
        const goalP = parseFloat(document.getElementById('goalProt')?.dataset.val) || 0;

        // CALCULATE BREAKDOWN
        const kcalOut = goalTotal * (pct / 100);
        const protOut = goalP * (pct / 100);
        const kcalMain = goalTotal * ((100 - pct) / 100);
        const protMain = goalP * ((100 - pct) / 100);

        if (breakdownPanel) breakdownPanel.style.display = (pct > 0) ? 'block' : 'none';
        if (breakdownOut) breakdownOut.innerText = `${Math.round(kcalOut)} Kcal | ${protOut.toFixed(1)}g P`;
        if (breakdownMain) breakdownMain.innerText = `${Math.round(kcalMain)} Kcal | ${protMain.toFixed(1)}g P`;

        // Update AppState for Simulation
        AppState.traslape.sourceKcal = kcalOut;
        AppState.traslape.sourceProt = protOut;
        AppState.traslape.pct = pct;
        AppState.traslape.active = (pct > 0);

        window.runSimulation();
    };

    // --- NEW V4.60: Advanced NPT Calculator Logic ---
    window.updateNPTCalculator = () => {
        const vol = parseFloat(document.getElementById('nptVol')?.value) || 0;
        const dex = parseFloat(document.getElementById('nptDex')?.value) || 0;
        const aa = parseFloat(document.getElementById('nptAA')?.value) || 0;
        const lip = parseFloat(document.getElementById('nptLip')?.value) || 0;
        const na = parseFloat(document.getElementById('nptNa')?.value) || 0;
        const k = parseFloat(document.getElementById('nptK')?.value) || 0;
        const weight = AppState.patient?.peso_calculo || AppState.patient?.peso || 0;

        if (document.getElementById('nptWeight')) {
            document.getElementById('nptWeight').value = weight;
        }

        // 1. Kcal No Proteicas (KcalNP)
        const kcalDex = dex * 3.4;
        const kcalLip = lip * 2.0; // 20% lipids = 2 kcal/ml
        const kcalNP = kcalDex + kcalLip;

        // 2. GIR (Carga Glucosa) - mg/kg/min
        let gir = 0;
        if (weight > 0) {
            gir = (dex * 1000) / (weight * 1440);
        }

        // 3. Nitrogen (g)
        const nitro = aa / 6.25;

        // 4. Osmolarity (approx mOsm/L)
        let osm = 0;
        if (vol > 0) {
            const dexL = (dex / vol) * 1000;
            const aaL = (aa / vol) * 1000;
            const naL = (na / vol) * 1000;
            const kL = (k / vol) * 1000;
            osm = (dexL * 5) + (aaL * 10) + (naL * 2) + (kL * 2);
        }

        // Update UI Results
        if (document.getElementById('nptOsm')) document.getElementById('nptOsm').innerText = Math.round(osm);
        if (document.getElementById('nptGIR')) document.getElementById('nptGIR').innerText = gir.toFixed(1);
        if (document.getElementById('nptKcalNP')) document.getElementById('nptKcalNP').innerText = Math.round(kcalNP);
        if (document.getElementById('nptKcalGN')) {
            const ratio = nitro > 0 ? (kcalNP / nitro) : 0;
            document.getElementById('nptKcalGN').innerText = Math.round(ratio);
        }

        // Osmolarity Status (Central vs Peripheral)
        const statusEl = document.getElementById('nptStatus');
        if (statusEl) {
            if (osm > 800) {
                statusEl.innerText = "Central";
                statusEl.style.background = "#e74c3c";
            } else {
                statusEl.innerText = "Periférica";
                statusEl.style.background = "#27ae60";
            }
        }
    };

    // --- NEW V4.24: Adequacy Mode Control ---
    window.setAdequacyMode = (mode) => {
        AppState.adequacyMode = mode;

        // Update UI buttons
        const btnGoal = document.getElementById('btnAdeqGoal');
        const btnGET = document.getElementById('btnAdeqGET');

        if (btnGoal && btnGET) {
            if (mode === 'goal') {
                btnGoal.style.background = '#6c5ce7';
                btnGoal.style.color = 'white';
                btnGET.style.background = 'transparent';
                btnGET.style.color = '#666';
            } else {
                btnGET.style.background = '#3498db';
                btnGET.style.color = 'white';
                btnGoal.style.background = 'transparent';
                btnGoal.style.color = '#666';
            }
        }

        window.updatePrescriptionStrategy();
        updateMacroGoals();
        runSimulation();
    };

    // --- NEW V4.23: Real-time Strategic Feedback (Intake vs Requirement) ---
    window.updatePrescriptionStrategy = (currentKcalOverride) => {
        const p = AppState.patient || {};
        const mode = AppState.adequacyMode || 'goal';

        // Use provided kcal (from simulation) or scrape from UI
        let currentKcal = currentKcalOverride;
        if (currentKcal === undefined) {
            currentKcal = parseFloat(document.getElementById('valKcal')?.innerText) || 0;
        }

        // The denominator is determined by the selected clinical mode
        const goalTotal = parseFloat(document.getElementById('goalTotal')?.value) || 0;
        const theoreticalGET = p.tmt_calculated || 0;

        const targetDenominator = (mode === 'goal') ? (goalTotal || theoreticalGET) : theoreticalGET;
        const labelBase = (mode === 'goal') ? 'Meta' : 'GET';

        const badge = document.getElementById('strategyBadge');
        const fdbkText = document.getElementById('strategyText');
        const fdbkIcon = document.getElementById('strategyIcon');
        const fdbkCard = document.getElementById('strategyFeedback');

        if (!badge) return;

        // Reset state if no data
        if (targetDenominator <= 0 || currentKcal < 0) {
            badge.innerText = '--% ADECUACIÃ“N';
            badge.style.color = '#888';
            badge.style.background = '#eee';
            badge.style.borderColor = '#ddd';
            if (fdbkText) fdbkText.innerText = `Ingresa volumen para medir adecuación vs ${labelBase}.`;
            return;
        }

        const adequacy = (currentKcal / targetDenominator) * 100;
        badge.innerText = `${labelBase}: ${adequacy.toFixed(0)}%`;
        badge.style.display = 'inline-block';

        let label = '';
        let color = '';
        let icon = '';
        let bgColor = '';

        if (adequacy < 40) {
            label = 'Inicio / Refeeding';
            color = '#e67e22';
            icon = '⚠️';
            bgColor = 'rgba(230, 126, 34, 0.05)';
        } else if (adequacy < 85) {
            label = 'Progresión';
            color = '#3498db';
            icon = '📈';
            bgColor = 'rgba(52, 152, 219, 0.05)';
        } else if (adequacy <= 115) {
            label = 'Meta Alcanzada';
            color = '#27ae60';
            icon = '✅';
            bgColor = 'rgba(39, 174, 96, 0.05)';
        } else {
            label = 'Sobrealimentación / Superávit';
            color = '#e74c3c';
            icon = '🔥';
            bgColor = 'rgba(231, 76, 60, 0.05)';
        }

        if (fdbkText) fdbkText.innerText = `Estado (${labelBase}): ${label} (${Math.round(currentKcal)} kcal de ${Math.round(targetDenominator)} kcal)`;
        if (fdbkText) fdbkText.style.color = color;
        if (fdbkIcon) fdbkIcon.innerText = icon;
        if (fdbkCard) {
            fdbkCard.style.borderColor = color + '44';
            fdbkCard.style.background = bgColor;
        }
        badge.style.color = color;
        badge.style.borderColor = color + '66';
        badge.style.background = bgColor;
    };

    const inpGoalKcal = document.getElementById('goalKcalBox');
    const inpGoalTotal = document.getElementById('goalTotal');

    if (inpGoalKcal) {
        inpGoalKcal.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            const weight = parseFloat(document.getElementById('peso')?.value) || 0;
            const total = Math.round(val * weight);
            const resEvo = document.getElementById('evolutionResult');
            if (resEvo) resEvo.innerText = `= ${total} kcal/día`;

            if (inpGoalTotal && document.getElementById('getSelector')?.value === 'factorial') {
                inpGoalTotal.value = total;
                window.updatePrescriptionStrategy();
                runSimulation();
                updateMacroGoals();
            }
        });
    }

    if (inpGoalTotal) {
        inpGoalTotal.addEventListener('input', () => {
            window.updatePrescriptionStrategy();
            runSimulation();
            updateMacroGoals();
        });
    }

    if (inpGoalTotal) {
        inpGoalTotal.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;

            // Update Simulator and AppsState
            AppState.userOverridesGoal = true;
            const simGoal = document.getElementById('simGoal');
            if (simGoal) simGoal.innerText = Math.round(val);
            runSimulation();

            // Store and show date
            const today = new Date().toLocaleDateString('es-CL');
            localStorage.setItem('sedile_last_goal_date', today);
            const lastGoalLbl = document.getElementById('valLastGoalDate');
            if (lastGoalLbl) lastGoalLbl.innerText = `Ultima meta: ${today}`;
        });
    }

    // NEW V3.62: Macro Goals Triggers
    const macroGoalsIds = ['goalProt', 'goalCHO', 'goalLip'];
    macroGoalsIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', runSimulation);
    });

    // NEW V3.16: CHUMLEA Estimation (Pediatrics/Adults)
    const chumleaInputs = ['altrodilla', 'edad', 'sexo'];
    chumleaInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calcChumleaWeight);
    });

    const chumleaWatcher = document.querySelectorAll('.input-watch-chumlea');
    chumleaWatcher.forEach(inp => inp.oninput = calcChumleaWeight);

    // NEW V3.41: Advanced Anthropometry (Frisancho/NHANES)
    ['cbraquial', 'ptricipital', 'edad', 'sexo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateAnthropometry);
    });
}

function calcChumleaWeight() {
    const p = AppState.patient || {};
    const atr = parseFloat(document.getElementById('altrodilla')?.value) || 0;
    const age = parseFloat(document.getElementById('edad')?.value) || 0;
    const sex = document.getElementById('sexo')?.value;
    const method = document.getElementById('altrodillaMethodSelect')?.value || 'ross';

    const badgeW = document.getElementById('valChumleaWeight');
    const badgeS = document.getElementById('valRossStature');
    const badgeWDisplay = document.getElementById('valChumleaWeightBadge');
    const badgeSDisplay = document.getElementById('valRossStatureBadge');
    const lblS = document.getElementById('lblRossStatureBadgeText');
    const lblW = document.getElementById('lblChumleaWeightBadgeText');

    if (lblS) lblS.innerText = method === 'ross' ? 'Talla Ross' : 'Talla Chumlea';
    if (lblW) lblW.innerText = method === 'ross' ? 'Peso Ross' : 'Peso Chumlea';

    if (atr > 0) {
        let stature = 0;
        let weight = 0;

        if (method === 'ross' || method === 'chumlea') {
            // Stature Formula based on Age Group
            if (age < 18) {
                // Pediatric / Adolescent formula (Stevenson / Chumlea 6-18)
                stature = (2.15 * atr) + 38.0;
            } else if (age >= 60) {
                // Elderly (>= 60 years)
                if (sex === 'f') {
                    stature = (1.83 * atr) - (0.24 * age) + 84.88;
                } else {
                    stature = (2.02 * atr) - (0.04 * age) + 64.19;
                }
            } else {
                // Adult (18-59 years)
                if (sex === 'f') {
                    stature = (1.83 * atr) - (0.06 * age) + 82.47;
                } else {
                    stature = (2.08 * atr) + 66.02;
                }
            }

            if (method === 'ross') {
                // Ross Weight Formula (2-variable)
                const cb = parseFloat(document.getElementById('cbraquial')?.value) || 30; // Default Mid-arm circumference
                if (sex === 'f') {
                    if (age >= 60) {
                        weight = (1.09 * atr) + (2.68 * cb) - 65.51;
                    } else {
                        weight = (1.01 * atr) + (2.81 * cb) - 66.04;
                    }
                } else {
                    if (age >= 60) {
                        weight = (1.10 * atr) + (3.07 * cb) - 75.81;
                    } else {
                        weight = (1.19 * atr) + (3.21 * cb) - 86.82;
                    }
                }
            } else {
                // Chumlea Weight Formula (4-variable using standard clinical defaults or inputs)
                const cb = parseFloat(document.getElementById('cbraquial')?.value) || 30;
                const pt = parseFloat(document.getElementById('ptricipital')?.value) || 15; // default PT
                const cp = parseFloat(document.getElementById('cpantorrilla')?.value) || 30; // default CP
                if (sex === 'f') {
                    weight = (1.27 * atr) + (0.87 * cb) + (0.41 * pt) + (0.11 * cp) - 43.1;
                } else {
                    weight = (0.98 * atr) + (1.16 * cb) + (0.37 * pt) + (1.16 * cp) - 35.8;
                }
            }
        }

        // Update UI Badges
        if (badgeSDisplay) badgeSDisplay.innerText = `${stature.toFixed(1)} cm`;
        if (badgeWDisplay) badgeWDisplay.innerText = `${weight.toFixed(1)} kg`;

        // Update hidden inputs for persistence/IA
        if (badgeW) badgeW.value = weight.toFixed(1) + ' kg';
        if (badgeS) badgeS.value = stature.toFixed(1) + ' cm';
    } else {
        if (badgeSDisplay) badgeSDisplay.innerText = '-- cm';
        if (badgeWDisplay) badgeWDisplay.innerText = '-- kg';
        if (badgeW) badgeW.value = '';
        if (badgeS) badgeS.value = '';
    }
}

/**
 * NEW V3.41: Advanced Anthropometry Classification (Frisancho & NHANES)
 * Uses Red-themed UI, Percentile Logic, and Area G (AMA) calculation.
 */
function updateAnthropometry() {
    const p = AppState.patient || {};
    const cb = parseFloat(document.getElementById('cbraquial')?.value) || 0;
    const pt = parseFloat(document.getElementById('ptricipital')?.value) || 0;
    const age = parseFloat(document.getElementById('edad')?.value) || 0;
    const sex = document.getElementById('sexo')?.value;
    const sel = document.getElementById('frisanchoMethodSelect');
    if (sel) {
        if (typeof window.event !== 'undefined' && window.event && window.event.target === sel) {
            sel.dataset.userModified = 'true';
        }
        if (!sel.dataset.userModified) {
            if (age >= 70) {
                if (sel.value !== 'nhanes3_elderly') {
                    sel.value = 'nhanes3_elderly';
                }
            } else {
                if (sel.value === 'nhanes3_elderly') {
                    sel.value = 'nhanes3';
                }
            }
        }
    }
    const method = sel?.value || 'nhanes3';

    const lblCB = document.getElementById('lblCBStatus');
    const lblAMB = document.getElementById('lblAMBStatus');
    const lblAGB = document.getElementById('lblAGBStatus');
    const indicator = document.getElementById('anthIndicator');
    const badgeDate = document.getElementById('valAnthDate');
    const refSub = document.getElementById('lblFrisanchoReferenceText');

    if (refSub) {
        if (method === 'nhanes3_elderly') {
            refSub.innerText = 'Referencia: NHANES III (Adulto Mayor >= 70 años)';
        } else if (method === 'nhanes3') {
            refSub.innerText = 'Referencia: Frisancho 1990';
        } else {
            refSub.innerText = 'Referencia: Frisancho 1981 (NHANES I)';
        }
    }

    if (cb > 0 || pt > 0) {
        // 1. Calculate Area G (AMA - Arm Muscle Area)
        let ama = 0;
        if (cb > 0 && pt > 0) {
            const ptcm = pt / 10;
            const pi = 3.14159265;
            ama = Math.pow(cb - (pi * ptcm), 2) / (4 * pi);
            // Heymsfield correction for bone area
            if (sex === 'm') ama -= 10; else ama -= 6.5;
            if (ama < 0) ama = 0;
        }

        // 2. Reference Tables
        // NHANES III (Frisancho 1990)
        const nhanes3Refs = {
            cb: {
                m: {
                    18: { p5: 27.2, p10: 28.2, p50: 32.7, p90: 37.7, p95: 39.5 },
                    35: { p5: 29.2, p10: 30.4, p50: 34.7, p90: 39.6, p95: 41.1 },
                    65: { p5: 27.0, p10: 28.5, p50: 32.7, p90: 37.5, p95: 39.0 },
                    75: { p5: 25.5, p10: 27.0, p50: 30.7, p90: 35.5, p95: 37.0 }
                },
                f: {
                    18: { p5: 23.5, p10: 24.5, p50: 28.5, p90: 33.5, p95: 35.5 },
                    35: { p5: 25.4, p10: 26.8, p50: 32.1, p90: 38.8, p95: 41.7 },
                    65: { p5: 24.5, p10: 26.0, p50: 31.7, p90: 38.5, p95: 41.0 },
                    75: { p5: 22.5, p10: 24.0, p50: 28.6, p90: 34.5, p95: 36.5 }
                }
            },
            ag: { // represents AMB
                m: {
                    18: { p5: 41.5, p10: 45.4, p50: 59.9, p90: 77.8, p95: 83.2 },
                    35: { p5: 44.5, p10: 48.9, p50: 64.1, p90: 83.5, p95: 90.0 },
                    65: { p5: 38.0, p10: 42.1, p50: 56.5, p90: 75.0, p95: 80.0 },
                    75: { p5: 32.0, p10: 36.0, p50: 48.0, p90: 65.0, p95: 70.0 }
                },
                f: {
                    18: { p5: 29.4, p10: 32.0, p50: 39.5, p90: 51.0, p95: 55.4 },
                    35: { p5: 31.0, p10: 34.5, p50: 44.2, p90: 60.5, p95: 65.5 },
                    65: { p5: 28.0, p10: 31.5, p50: 42.0, p90: 58.0, p95: 63.5 },
                    75: { p5: 24.0, p10: 27.5, p50: 36.5, p90: 52.0, p95: 57.0 }
                }
            }
        };

        // Frisancho 1981 (NHANES I)
        const frisancho1981Refs = {
            cb: {
                m: {
                    18: { p5: 26.8, p10: 27.8, p50: 31.8, p90: 36.8, p95: 38.5 },
                    35: { p5: 28.5, p10: 29.8, p50: 33.8, p90: 38.5, p95: 40.0 },
                    65: { p5: 26.5, p10: 27.8, p50: 31.8, p90: 36.0, p95: 37.5 },
                    75: { p5: 25.0, p10: 26.5, p50: 30.0, p90: 34.5, p95: 36.0 }
                },
                f: {
                    18: { p5: 22.5, p10: 23.5, p50: 27.0, p90: 31.5, p95: 33.5 },
                    35: { p5: 24.5, p10: 25.8, p50: 30.8, p90: 36.8, p95: 39.5 },
                    65: { p5: 23.5, p10: 24.8, p50: 29.8, p90: 35.8, p95: 38.0 },
                    75: { p5: 22.0, p10: 23.5, p50: 28.0, p90: 33.5, p95: 35.0 }
                }
            },
            ag: { // represents AMB
                m: {
                    18: { p5: 35.8, p10: 38.5, p50: 51.3, p90: 63.7, p95: 66.6 },
                    35: { p5: 37.5, p10: 41.0, p50: 56.0, p90: 69.0, p95: 72.0 },
                    65: { p5: 31.2, p10: 33.8, p50: 45.2, p90: 57.5, p95: 62.0 },
                    75: { p5: 28.0, p10: 31.0, p50: 41.0, p90: 52.0, p95: 56.0 }
                },
                f: {
                    18: { p5: 24.8, p10: 26.8, p50: 33.2, p90: 41.8, p95: 45.2 },
                    35: { p5: 26.5, p10: 28.5, p50: 36.5, p90: 48.5, p95: 52.5 },
                    65: { p5: 24.0, p10: 26.0, p50: 32.5, p90: 45.0, p95: 49.0 },
                    75: { p5: 22.0, p10: 24.0, p50: 29.0, p90: 40.0, p95: 44.0 }
                }
            }
        };

        // NHANES III (Adulto Mayor >= 70 años)
        const nhanes3ElderlyRefs = {
            cb: {
                m: {
                    70: { p5: 26.0, p10: 27.5, p50: 31.5, p90: 36.0, p95: 37.5 },
                    80: { p5: 24.5, p10: 25.8, p50: 29.5, p90: 34.0, p95: 35.5 }
                },
                f: {
                    70: { p5: 23.0, p10: 24.5, p50: 29.0, p90: 35.0, p95: 36.5 },
                    80: { p5: 21.5, p10: 22.8, p50: 27.0, p90: 32.5, p95: 34.0 }
                }
            },
            ag: {
                m: {
                    70: { p5: 28.5, p10: 31.5, p50: 41.5, p90: 52.5, p95: 56.5 },
                    80: { p5: 26.0, p10: 28.5, p50: 38.0, p90: 48.0, p95: 52.0 }
                },
                f: {
                    70: { p5: 23.0, p10: 25.0, p50: 30.0, p90: 41.5, p95: 45.5 },
                    80: { p5: 21.0, p10: 22.8, p50: 27.5, p90: 37.5, p95: 41.5 }
                }
            }
        };

        const activeRefs = method === 'nhanes3' ? nhanes3Refs : (method === 'nhanes3_elderly' ? nhanes3ElderlyRefs : frisancho1981Refs);

        const getPercentileMatch = (type, val) => {
            if (val <= 0) return { status: '--', color: '#888', pos: 50 };
            const sexRefs = activeRefs[type][sex === 'f' ? 'f' : 'm'];
            const keys = Object.keys(sexRefs).map(Number).sort((a, b) => b - a);
            const refKey = keys.find(k => age >= k) || keys[keys.length - 1];
            const p = sexRefs[refKey];

            if (val < p.p5) return { status: 'Muy Disminuido', color: '#c0392b', pos: 2.5 };
            if (val < p.p10) return { status: 'Disminuido', color: '#e67e22', pos: 7.5 };
            if (val < p.p90) return { status: 'Normal', color: '#27ae60', pos: 50 };
            if (val <= p.p95) return { status: 'Elevado', color: '#3498db', pos: 92.5 };
            return { status: 'Muy Elevado', color: '#9b59b6', pos: 97.5 };
        };

        const resCB = getPercentileMatch('cb', cb);
        const resAG = getPercentileMatch('ag', ama);

        p.cbStatus = resCB.status;
        p.amaStatus = ama > 0 ? resAG.status : null;

        // Calculate Arm Fat Area (AGB)
        let agb = 0;
        if (cb > 0 && pt > 0) {
            const atb = Math.pow(cb, 2) / (4 * Math.PI);
            agb = atb - ama;
            if (agb < 0) agb = 0;
        }

        if (lblCB) lblCB.innerHTML = `<span style="color:${resCB.color}; font-size:0.85rem;">${resCB.status}</span><br><small style="color:#888; font-weight:400;">CB: ${cb} cm</small>`;
        if (lblAMB && ama > 0) lblAMB.innerHTML = `<span style="color:${resAG.color}; font-size:0.85rem;">${resAG.status}</span><br><small style="color:#888; font-weight:400;">AMB: ${ama.toFixed(1)} cm²</small>`;
        else if (lblAMB) lblAMB.innerHTML = "--";

        if (lblAGB && agb > 0) {
            lblAGB.innerHTML = `<span style="color:#e67e22; font-size:0.85rem;">Calculado</span><br><small style="color:#888; font-weight:400;">AGB: ${agb.toFixed(1)} cm²</small>`;
        } else if (lblAGB) {
            lblAGB.innerHTML = "--";
        }

        // 3. Update Graphical Indicator
        if (indicator) {
            let pos = resCB.pos;
            if (ama > 0) pos = (resCB.pos + resAG.pos) / 2;
            indicator.style.left = pos + '%';
        }

        // 4. Update Timestamp
        if (badgeDate) {
            const now = new Date();
            badgeDate.innerText = `Act: ${now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
        }
    } else {
        p.cbStatus = null;
        p.amaStatus = null;
        if (lblCB) lblCB.innerHTML = '--';
        if (lblAMB) lblAMB.innerHTML = '--';
        if (lblAGB) lblAGB.innerHTML = '--';
        if (indicator) indicator.style.left = '50%';
        if (badgeDate) badgeDate.innerText = 'Última act: --';
    }
}

// --- 16. TAB NAVIGATION (NEW V3.7) ---
function initTabNavigation() {
    const tabs = document.querySelectorAll('.app-tabs .tab-btn');
    const views = document.querySelectorAll('.view-section');

    window.switchAppView = (targetView) => {
        // UI Update: Tabs (only affects app-tabs, not the header button)
        tabs.forEach(t => {
            t.classList.remove('active');
            if (t.dataset.view === targetView) {
                t.classList.add('active');
            }
        });

        // UI Update: Views
        views.forEach(v => {
            v.classList.remove('active-view');
            v.style.display = 'none';
        });

        const activeView = document.getElementById(`view-${targetView}`);
        if (activeView) {
            activeView.style.display = 'block';
            void activeView.offsetWidth; // Trigger reflow
            activeView.classList.add('active-view');
        }

        // Action Triggers based on Tab
        if (targetView === 'ward') {
            loadWardKanban();
        }
    };

    // Bind original tabs
    tabs.forEach(tab => {
        tab.onclick = () => window.switchAppView(tab.dataset.view);
    });

    // Bind new Header Ward button
    const btnWardHeader = document.getElementById('btnOpenWard');
    if (btnWardHeader) {
        btnWardHeader.onclick = () => window.switchAppView('ward');
    }
}

let toastTimer = null;
function showToast(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(44, 62, 80, 0.95)';
        toast.style.color = 'white';
        toast.style.padding = '10px 22px';
        toast.style.borderRadius = '30px';
        toast.style.zIndex = '10000';
        toast.style.fontSize = '0.85rem';
        toast.style.fontWeight = '600';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        document.body.appendChild(toast);
    }
    if (toastTimer) clearTimeout(toastTimer);
    toast.innerHTML = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3000);
}
// --- 17. GLOBAL EVENTS & MISC (CLEANUP V3.16.2) ---
function initGlobalEvents() {
    // TMB Logic
    const btnTMB = document.getElementById('btnCalcTMB');
    if (btnTMB) btnTMB.onclick = calcTMB_OMS;

    // Factorial Logic
    const inpFactor = document.getElementById('factorKcal');
    if (inpFactor) inpFactor.oninput = calcFactorial;

    // Edema/Dry Weight Logic
    const selEdema = document.getElementById('edemaGrade');
    if (selEdema) selEdema.onchange = window.updateDryWeight;
    const selAscites = document.getElementById('ascitesGrade');
    if (selAscites) selAscites.onchange = window.updateDryWeight;

    // Exams Logic
    const btnAddExam = document.getElementById('btnAddExam');
    if (btnAddExam) {
        btnAddExam.onclick = (e) => {
            e.preventDefault();
            addExamRow();
        };
    }

    // Nitrogen Logic
    const inpNUU = document.getElementById('valNUU');
    const inpNFactor = document.getElementById('valNFactor');
    const fnBN = () => calcNitrogenBalance();
    if (inpNUU) inpNUU.oninput = fnBN;
    if (inpNFactor) inpNFactor.oninput = fnBN;

    // New Patient Logic V3.51/V3.6
    const btnNew = document.getElementById('btnAddPatient');
    if (btnNew) btnNew.onclick = resetPatientForm;

    // Drug Interaction Search Logic V3.50
    const inpDrug = document.getElementById('drugSearch');
    const outDrug = document.getElementById('drugInteractionResult');
    if (inpDrug && outDrug) {
        inpDrug.oninput = (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 3) {
                outDrug.innerHTML = '<span style="opacity:0.5;">Busca un medicamento para ver recomendaciones...</span>';
                return;
            }
            const drugKey = Object.keys(DRUG_INTERACTIONS).find(k => k.includes(query));
            if (drugKey) {
                outDrug.innerHTML = `<div style="padding:10px; background:rgba(231, 76, 60, 0.1); border-radius:10px; border-left:4px solid #e74c3c;">
                    <strong>${drugKey.toUpperCase()}:</strong><br>${DRUG_INTERACTIONS[drugKey]}
                </div>`;
            } else {
                outDrug.innerHTML = '<span style="color:#888;">No se encontró el fármaco. Intenta con una palabra clave.</span>';
            }
        };
    }

    // Restore notes preview preferences if they exist
    const prefFont = localStorage.getItem('notePrefFont');
    const prefSize = localStorage.getItem('notePrefSize');
    if (prefFont) {
        const sel = document.getElementById('noteFontFamily');
        if (sel) sel.value = prefFont;
    }
    if (prefSize) {
        const sel = document.getElementById('noteFontSize');
        if (sel) sel.value = prefSize;
    }
    if (typeof window.updateNoteStyle === 'function') {
        window.updateNoteStyle();
    }

    if (typeof window.syncPatientTypeSelector === 'function') {
        window.syncPatientTypeSelector();
    }

    // Clinical Note Generator V3.50 (Updated to Valoración de Ingreso VI)
    window.generateValoracionIngreso = function () {
        const container = document.getElementById('clinicalNoteContainer');
        const content = document.getElementById('noteContent');
        if (!container || !content) return;

        const p = AppState.patient || {};

        const fId = document.getElementById('formulaSelect')?.value;
        const formula = AppState.formulas ? AppState.formulas.find(f => f.id === fId) : null;
        const vol = window.getEffectiveSimulationVolume ? window.getEffectiveSimulationVolume() : 0;
        const reqsVI = window.getEffectiveMacroRequirements ? window.getEffectiveMacroRequirements() : {
            goal: parseFloat(document.getElementById('goalTotal')?.value) || 0,
            pTotal: parseFloat(document.getElementById('goalProt')?.dataset.val) || 0,
            cTotal: parseFloat(document.getElementById('goalCHO')?.dataset.val) || 0,
            lTotal: parseFloat(document.getElementById('goalLip')?.dataset.val) || 0,
            factorKcalVal: 0, factorProtVal: 0
        };
        const goal = reqsVI.goal;
        let pTotal = reqsVI.pTotal;
        let cTotal = reqsVI.cTotal;
        let lTotal = reqsVI.lTotal;

        let modulesText = "";
        const mods = ["Nessucar", "MCT", "Enterex", "Banatrol", "Proteinex", "Fresubin"];
        mods.forEach(m => {
            const val = parseFloat(document.getElementById('mod' + m)?.value) || 0;
            if (val > 0) modulesText += `${m}: ${val} ${m === "MCT" ? "ml" : "g"}, `;
        });

        const examenes = document.getElementById('evoExamenes')?.value || "Sin reportar";
        const tolerancia = document.getElementById('evoTolerancia')?.value || "Adecuada";
        const des = document.getElementById('diagnosticoPES')?.value || "Sin diagnóstico ingresado";

        const pesoFisico = p.peso || 0;
        const pesoCalc = document.getElementById('pesoCalculoSelect')?.value === 'real' ? pesoFisico : (p.peso_calculo || pesoFisico);

        let estaturaM = p.estatura || 0;
        if (!estaturaM) {
            const rawEst = document.getElementById('estatura')?.value;
            if (rawEst) {
                const parsed = parseFloat(rawEst.replace(',', '.'));
                if (parsed > 0) estaturaM = parsed > 3 ? parsed / 100 : parsed;
            }
        }
        const cm = estaturaM > 0 ? (estaturaM * 100).toFixed(1) : (parseFloat(document.getElementById('tallaCM')?.value) || (p.estatura ? (p.estatura * 100).toFixed(1) : 0));
        const sctVal = document.getElementById('valSCT')?.innerText || '-- m²';

        const isBotellin = formula && formula.isBotellin;
        const rawVol = parseFloat(document.getElementById('volume')?.value) || 0;
        const mode = AppState.patient?.type || 'adult';
        let volText = "";
        if (mode === 'pediatric' || mode === 'neonate') {
            const tInp = document.getElementById('volumeTimes');
            const times = tInp ? parseInt(tInp.value) || 1 : 1;
            if (times > 1) {
                volText = `${rawVol} ml x ${times} veces (${rawVol * times} ml totales)`;
            } else {
                volText = `${rawVol} ml`;
            }
        } else {
            volText = isBotellin ? `${vol} Unidad(es) (${vol * (formula.volUnit || 1)} ml totales)` : `${vol} ml`;
        }

        // Build VI Clinical Note Text
        const pName = document.getElementById('nombre')?.value || p.nombre || 'Sin nombre';
        const numFicha = document.getElementById('num_ficha')?.value || 'S/N';
        const antecedentesMorbidos = document.getElementById('antecedentes_morbidos')?.value || 'Sin antecedentes reportados';
        const pAgeVal = document.getElementById('edad')?.value || p.edad;
        const pAge = pAgeVal ? `${pAgeVal} años` : (p.exactMonths ? `${p.exactMonths.toFixed(1)} meses` : '--');
        const pSexVal = document.getElementById('sexo')?.value || p.sexo;
        const pSex = pSexVal === 'm' ? 'Masculino' : (pSexVal === 'f' ? 'Femenino' : '--');
        const pCama = document.getElementById('cama')?.value || p.cama || 'S/N';
        
        const dxMedico = document.getElementById('diagnostico')?.value || p.diagnostico || 'Sin diagnóstico médico';
        
        const imcNum = p.bmi || (pesoFisico > 0 && (typeof estaturaM !== 'undefined' ? estaturaM : p.estatura) > 0 ? (pesoFisico / Math.pow(typeof estaturaM !== 'undefined' ? estaturaM : p.estatura, 2)) : 0);
        const imcValText = imcNum > 0 ? `${imcNum.toFixed(1)}` : (document.getElementById('valAdultIMC')?.innerText?.replace(' kg/m²', '') || document.getElementById('valBMI')?.innerText || '--');
        const tallaVal = cm > 0 ? `${cm} cm` : '--';
        const pesoVal = pesoFisico > 0 ? `${pesoFisico} kg` : '--';
        const cbVal = document.getElementById('cbraquial')?.value || '--';
        
        const nrsTotal = document.getElementById('nrsTotalScore')?.innerText || 'No evaluado';
        const nrsClassif = document.getElementById('nrsClassif')?.innerText || '';
        const nrsString = nrsClassif ? `${nrsTotal} (${nrsClassif})` : nrsTotal;
        
        const valKcalEl = document.getElementById('valKcal');
        const valProtEl = document.getElementById('valProt');
        const totalKcalVal = valKcalEl ? parseFloat(valKcalEl.innerText) || 0 : 0;
        const totalProtVal = valProtEl ? parseFloat(valProtEl.innerText) || 0 : 0;

        const kcalFinal = totalKcalVal > 0 ? Math.round(totalKcalVal) : Math.round(goal);
        const protFinal = totalProtVal > 0 ? totalProtVal.toFixed(1) : pTotal.toFixed(1);

        let aporteStr = `Aporte: ${kcalFinal} kcal`;
        if (pesoCalc > 0) {
            aporteStr += ` (${(kcalFinal / pesoCalc).toFixed(1)} kcal/kg)`;
        }
        aporteStr += ` / ${protFinal} g proteína`;
        if (pesoCalc > 0) {
            aporteStr += ` (${(parseFloat(protFinal) / pesoCalc).toFixed(2)} g/kg)`;
        }

        const dietoterapiaFinalBase = window.generateDietoterapiaString ? window.generateDietoterapiaString(kcalFinal, protFinal, pesoCalc) : aporteStr;
        const dietoterapia = `${dietoterapiaFinalBase}\nSe realizará control de exámenes, ingesta, deposiciones, y suplementación en caso de no cubrir requerimientos nutricionales.`;

        const userName = AppState.user?.user_metadata?.full_name || "[Nombre del Profesional]";

        // Gastrointestinal symptoms
        const getToggleVal = (id) => {
            const group = document.querySelector(`.toggle-btn-group[data-id="${id}"]`);
            if (!group) return 'no';
            const activeBtn = group.querySelector('.btn-toggle.active');
            return activeBtn ? activeBtn.innerText.trim().toLowerCase() : 'no';
        };

        const nauseasStr = `Náuseas (${getToggleVal('sintomaNauseas')})`;
        const vomitosStr = `Vómitos (${getToggleVal('sintomaVomitos')})`;
        const reflujoStr = `Reflujo Gastroesofágico (${getToggleVal('sintomaReflujo')})`;
        const deposicionesStr = `Deposiciones con Diarrea (${getToggleVal('sintomaDeposiciones')})`;
        const distensionStr = `Distensión Abdominal (${getToggleVal('sintomaDistension')})`;
        const gasesStr = `Gases/Flatulencia (${getToggleVal('sintomaGases')})`;
        
        const dentaduraStr = `Dentadura Adecuada (${getToggleVal('anamnesisDentadura')})`;
        const alergiasStr = `Alergias Alimentarias (${getToggleVal('anamnesisAlergias')})`;
        const deglucionStr = `Trastorno de Deglución (${getToggleVal('anamnesisDeglucion')})`;
        const apetitoStr = `Buen Apetito (${getToggleVal('anamnesisApetito')})`;

        const symptomsText = `${nauseasStr}, ${vomitosStr}, ${reflujoStr}, ${deposicionesStr}, ${distensionStr}, ${gasesStr}, ${dentaduraStr}, ${alergiasStr}, ${deglucionStr}, ${apetitoStr}`;

        // DNI Breve construction
        let ageCategory = "";
        const patientType = p.type || 'adult';
        if (patientType === 'adult') {
            const ageVal = parseFloat(document.getElementById('edad')?.value) || p.edad || 0;
            ageCategory = ageVal >= 65 ? "Adulto Mayor" : "Adulto";
        } else {
            const ageYears = parseFloat(document.getElementById('edad')?.value) || p.edad || 0;
            if (ageYears < 2) {
                ageCategory = "Lactante";
            } else if (ageYears < 6) {
                ageCategory = "Preescolar";
            } else if (ageYears < 12) {
                ageCategory = "Escolar";
            } else {
                ageCategory = "Adolescente";
            }
        }

        const sexText = pSexVal === 'm' ? 'Masculino' : (pSexVal === 'f' ? 'Femenino' : '--');
        const estadoNutricional = p.diagWeight || "Sin evaluar";

        let compBraquialText = "";
        const testStatus = p.amaStatus || p.cbStatus;
        if (testStatus) {
            compBraquialText = `(${testStatus})`;
        }

        let dniBreve = `${ageCategory}, ${sexText}, ${estadoNutricional}`;
        if (compBraquialText) {
            dniBreve += ` ${compBraquialText}`;
        }

        const cargoFirmaVI = window.getVGOServiceSignature ? window.getVGOServiceSignature() : "Nutricionista clínica";

        const currentServiceVal = (
            document.getElementById('vgoServiceSelect')?.value || 
            localStorage.getItem('selectedVGOService') || 
            AppState.currentService || 
            p.servicio || 
            ''
        ).toLowerCase();

        const isNeonateService = (
            patientType === 'neonate' || 
            mode === 'neonate' || 
            p.type === 'neonate' || 
            document.getElementById('ptNeonate')?.checked ||
            currentServiceVal.includes('neonat')
        );

        let viText = "";
        if (isNeonateService) {
            let fNacStr = "";
            const fnVal = document.getElementById('fechaNacimiento')?.value || p.fechaNacimiento;
            if (fnVal) {
                const parts = fnVal.split('-');
                if (parts.length === 3) {
                    fNacStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }

            const pesoNeoStr = p.peso_nacimiento || p.pn || (pesoFisico > 0 ? (pesoFisico < 10 ? `${Math.round(pesoFisico * 1000)} gr` : `${pesoFisico} gr`) : '');
            const longNeoStr = cm > 0 ? `${cm} cm` : (p.estatura ? `${Math.round(p.estatura * 100)} cm` : '');
            const pcNeoVal = parseFloat(document.getElementById('pcefalico')?.value) || p.pcefalico || 0;
            const pcNeoStr = pcNeoVal > 0 ? `${pcNeoVal} cm` : '';
            const dxMedStr = dxMedico && dxMedico !== 'Sin diagnóstico médico' ? dxMedico : '';
            const nutriSign = (userName && userName !== '[Nombre del Profesional]') ? userName : 'Barbara Veliz Ramirez';

            // Estructura personalizada adicional si existe
            const selService = document.getElementById('vgoServiceSelect')?.value || 'neonatologia';
            let customStructureVI = "";
            const savedKey = `vgoCustomStructure_${selService}`;
            const savedDataStr = localStorage.getItem(savedKey);
            if (savedDataStr) {
                try {
                    const savedData = JSON.parse(savedDataStr);
                    if (savedData.body && savedData.body.trim()) {
                        const headerTitle = savedData.title && savedData.title.trim() ? savedData.title.trim() : 'Campos Adicionales del Servicio';
                        customStructureVI = `\n${headerTitle}:\n${savedData.body.trim()}\n`;
                    }
                } catch (e) {}
            }

            viText = `INGRESO NUTRICIONAL

Nombre: ${pName}    Fecha de nacimiento: ${fNacStr}

Diagnóstico médico de ingreso:
${dxMedStr}

Datos Antropométricos: (De nacimiento, obtenidos de informe del RN)
Peso: ${pesoNeoStr}          
Longitud: ${longNeoStr}
P. Cefálico: ${pcNeoStr}

Observaciones:
${customStructureVI}

${nutriSign}  - Nutricionista UPC Neonatal`;

        } else if (patientType === 'adult') {
            const isElderly = pAgeVal >= 65;
            let clasifIMC = "Normopeso";
            if (isElderly) {
                if (imcNum > 0) {
                    if (imcNum < 23) clasifIMC = "Enflaquecido";
                    else if (imcNum < 28) clasifIMC = "Normopeso";
                    else if (imcNum < 32) clasifIMC = "Sobrepeso";
                    else clasifIMC = "Obeso";
                }
            } else {
                if (imcNum > 0) {
                    if (imcNum < 18.5) clasifIMC = "Bajo Peso";
                    else if (imcNum < 25) clasifIMC = "Normopeso";
                    else if (imcNum < 30) clasifIMC = "Sobrepeso";
                    else if (imcNum < 35) clasifIMC = "Obesidad Grado I";
                    else if (imcNum < 40) clasifIMC = "Obesidad Grado II";
                    else clasifIMC = "Obesidad Grado III";
                }
            }

            const isEstimated = (document.getElementById('altrodilla')?.value || document.getElementById('mediaenv')?.value || document.getElementById('pesoCalculoSelect')?.value !== 'real');
            const dataAntropoStr = isEstimated ? 'Antropometría estimada' : 'Antropometría en bipedestación';

            // Anamnesis and gastro signs
            const dSign = getToggleVal('anamnesisDentadura') === 'sí' ? '+' : '-';
            const alSign = getToggleVal('anamnesisAlergias') === 'sí' ? '+' : '-';
            const degSign = getToggleVal('anamnesisDeglucion') === 'sí' ? '+' : '-';
            const apSign = getToggleVal('anamnesisApetito') === 'sí' ? '+' : '-';

            const nSign = getToggleVal('sintomaNauseas') === 'sí' ? '+' : '-';
            const vSign = getToggleVal('sintomaVomitos') === 'sí' ? '+' : '-';
            const rSign = getToggleVal('sintomaReflujo') === 'sí' ? '+' : '-';
            const depSign = getToggleVal('sintomaDeposiciones') === 'sí' ? '-' : '+';
            const distSign = getToggleVal('sintomaDistension') === 'sí' ? '+' : '-';
            const gSign = getToggleVal('sintomaGases') === 'sí' ? '+' : '-';

            const dietoterapiaFinal = dietoterapiaFinalBase;

            viText = `INGRESO NUTRICIONAL 

${dataAntropoStr} 
• Peso: ${pesoFisico} Kg        • Talla: ${(cm / 100).toFixed(2).replace('.', ',')} mt           IMC: ${imcValText.replace('.', ',')} kg/mt2 (${clasifIMC})

Screening NRS 2002:
·	Puntaje: ${nrsTotal} ${parseInt(nrsTotal) === 1 ? 'punto' : 'puntos'}
·	Interpretación: ${nrsClassif ? nrsClassif.toLowerCase() : 'sin riesgo nutricional'}. Paciente ${parseInt(nrsTotal) >= 3 ? 'requiere soporte nutricional' : 'no requiere soporte nutricional'}

Anamnesis alimentaria:
Dentadura (${dSign}) - Alergias alimentarias (${alSign}) Intolerancia alimentaria (-) Dificultad para deglutir (${degSign}) apetito (${apSign}) 

Síntomas gastrointestinales:
Náuseas (${nSign}) Vómitos (${vSign}) Reflujo gastroesofágico (${rSign}) Deposiciones (${depSign}) Distensión abd (${distSign}) gases (${gSign}) 


Dietoterapia: ${dietoterapiaFinal} 

Plan: 
Seguimiento de deposiciones, síntomas gastrointestinales, presión arterial y glicemias. 
informar eventualidades


${userName}
${cargoFirmaVI}
Unidad de Alimentación y Nutrición`;
        } else {
            viText = `VALORACIÓN DE INGRESO NUTRICIONAL (VI)

[A - ASSESSMENT / VALORACIÓN]
• Datos del Paciente: Nombre: ${pName} | N° Ficha: ${numFicha} | Edad: ${pAge} | Sexo: ${pSex} | Cama: ${pCama}
• Diagnóstico Médico: ${dxMedico}
• Anamnesis y Síntomas: ${symptomsText}
• Antecedentes Mórbidos: ${antecedentesMorbidos}

Antropometría Básica:
- IMC: ${imcValText} kg/m² | Talla: ${tallaVal} | Peso: ${pesoVal} | CB: ${cbVal} cm
- NRS 2002 / Tamizaje: ${nrsString}

[D - DIAGNOSIS / DIAGNÓSTICO NUTRICIONAL]
• DNI Breve: ${dniBreve}

[I - INTERVENTION / INTERVENCIÓN Y DIETOTERAPIA]
• ${dietoterapia}

[M - MONITORING & E - EVALUATION / MONITOREO Y EVALUACIÓN]
• Monitoreo: Control diario de tolerancia, ingesta, exámenes y deposiciones.

Nutricionista Responsable: ${userName}
${cargoFirmaVI}
Unidad de nutrición y alimentación
Hospital Regional de Antofagasta`;
        }

        content.innerText = viText;
        if (typeof window.updateNoteStyle === 'function') {
            window.updateNoteStyle();
        }
        const titleH4 = document.querySelector('#clinicalNoteContainer h4');
        if (titleH4) titleH4.innerText = "Vista Previa de Valoración de Ingreso (VI)";
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });

        // Auto-mark patient as having VI completed
        if (AppState.patient) {
            AppState.patient.metadata = AppState.patient.metadata || {};
            AppState.patient.metadata.has_vi = true;
            AppState.patient.metadata.fecha_vi = new Date().toISOString();
            AppState.patient.metadata.fecha_evaluacion = new Date().toISOString();
            AppState.patient.evaluado = true;
            if (typeof window.savePatientToLocalStorage === 'function') {
                window.savePatientToLocalStorage(AppState.patient);
            }
            if (typeof supabaseClient !== 'undefined' && supabaseClient && AppState.patient.id && !String(AppState.patient.id).startsWith('pat_')) {
                supabaseClient.from('pacientes').update({
                    evaluado: true,
                    metadata: AppState.patient.metadata,
                    updated_at: new Date()
                }).eq('id', AppState.patient.id).then(() => {});
            }
        }
    };

    const btnNote = document.getElementById('btnGenerateNote');
    if (btnNote) btnNote.onclick = window.generateValoracionIngreso;

    // VGO Generator
    window.generateVGO = function () {
        const container = document.getElementById('clinicalNoteContainer');
        const content = document.getElementById('noteContent');
        if (!container || !content) return;

        const p = AppState.patient;
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const numFicha = document.getElementById('num_ficha')?.value || 'S/N';
        const antecedentesMorbidos = document.getElementById('antecedentes_morbidos')?.value || 'Sin antecedentes reportados';

        let ageStr = '--';
        if (p.ageParts) {
            ageStr = `${p.ageParts.y} años ${p.ageParts.m} meses`;
        }

        const sexStr = p.sexo === 'm' ? 'Masculino' : (p.sexo === 'f' ? 'Femenino' : 'No especificado');

        const pesoFisico = p.peso || 0;
        const pesoCalc = document.getElementById('pesoCalculoSelect')?.value === 'real' ? pesoFisico : (p.peso_calculo || pesoFisico);
        let estM = p.estatura || 0;
        if (!estM) {
            const rawEst = document.getElementById('estatura')?.value;
            if (rawEst) {
                const parsed = parseFloat(rawEst.replace(',', '.'));
                if (parsed > 0) estM = parsed > 3 ? parsed / 100 : parsed;
            }
        }
        const cm = estM > 0 ? (estM * 100).toFixed(1) : (parseFloat(document.getElementById('tallaCM')?.value) || (p.estatura ? (p.estatura * 100).toFixed(1) : 0));
        const tallaMt = estM > 0 ? estM.toFixed(2) : (cm > 0 ? (parseFloat(cm) / 100).toFixed(2) : '--');
        const cCintura = document.getElementById('ccintura')?.value || '--';
        const cBraquialVal = document.getElementById('cbraquial')?.value || '[Completar]';

        let calculatedBmi = p.bmi || 0;
        if (!calculatedBmi && pesoFisico > 0 && estM > 0) {
            calculatedBmi = pesoFisico / (estM * estM);
        }
        const domBmi = document.getElementById('valAdultIMC')?.innerText?.replace(' kg/m²', '') || document.getElementById('valBMI')?.innerText || document.getElementById('valIMC')?.innerText;
        const imcVal = calculatedBmi > 0 ? calculatedBmi.toFixed(1) : (domBmi && domBmi !== '--' ? domBmi : '--');

        let zImcDisplay = '--';
        let zTallaDisplay = '--';
        if (p.type === 'pediatric' || p.type === 'neonate') {
            const m = p.exactMonths || 0;
            const currentCm = parseFloat(cm) || (estM * 100);
            if (p.zScores?.bmi !== undefined && !isNaN(p.zScores.bmi)) {
                zImcDisplay = `${p.zScores.bmi > 0 ? '+' : ''}${p.zScores.bmi.toFixed(2)}`;
            } else if (typeof getZScore === 'function' && m > 0) {
                const z = m > 60 ? getZScore('bmi', m, p.sexo, calculatedBmi) : getZScore('wfh', currentCm, p.sexo, pesoFisico);
                if (z !== null && !isNaN(z)) zImcDisplay = `${z > 0 ? '+' : ''}${z.toFixed(2)}`;
            }
            if (p.zScores?.hfa !== undefined && !isNaN(p.zScores.hfa)) {
                zTallaDisplay = `${p.zScores.hfa > 0 ? '+' : ''}${p.zScores.hfa.toFixed(2)}`;
            } else if (typeof getZScore === 'function' && m > 0 && currentCm > 0) {
                const z = getZScore('hfa', m, p.sexo, currentCm);
                if (z !== null && !isNaN(z)) zTallaDisplay = `${z > 0 ? '+' : ''}${z.toFixed(2)}`;
            }
        }
        const zImcVal = (document.getElementById('valZBMI')?.innerText && document.getElementById('valZBMI')?.innerText !== '--') ? document.getElementById('valZBMI').innerText : zImcDisplay;
        const zTallaVal = (document.getElementById('valZHFA')?.innerText && document.getElementById('valZHFA')?.innerText !== '--') ? document.getElementById('valZHFA').innerText : zTallaDisplay;








        const des = document.getElementById('diagnosticoPES')?.value || "Sin diagnóstico ingresado";

        const reqs = window.getEffectiveMacroRequirements ? window.getEffectiveMacroRequirements() : {
            goal: parseFloat(document.getElementById('goalTotal')?.value) || 0,
            pTotal: parseFloat(document.getElementById('goalProt')?.dataset.val) || 0,
            cTotal: parseFloat(document.getElementById('goalCHO')?.dataset.val) || 0,
            lTotal: parseFloat(document.getElementById('goalLip')?.dataset.val) || 0,
            pPct: 0, cPct: 0, lPct: 0,
            factorKcalVal: 0, factorProtVal: 0
        };

        const goal = reqs.goal;
        const pTotal = reqs.pTotal;
        const cTotal = reqs.cTotal;
        const lTotal = reqs.lTotal;
        const pPct = reqs.pPct;
        const cPct = reqs.cPct;
        const lPct = reqs.lPct;

        const userName = AppState.user?.user_metadata?.full_name || "[Nombre del Profesional]";

        // Obtener fecha de nacimiento en formato chileno DD/MM/YYYY
        let fNacStr = "[Completar]";
        const fnVal = document.getElementById('fechaNacimiento')?.value;
        if (fnVal) {
            const [y, mm, d] = fnVal.split('-');
            fNacStr = `${d}/${mm}/${y}`;
        }

        // Obtener valores de la Anamnesis y STRONGkids / NRS 2002
        const anam = p.anamnesis || {};
        const sk = p.strongkids || { score: 0, classification: 'Riesgo bajo' };
        const nrs = p.nrs2002 || { score: 0, classification: 'Sin riesgo nutricional' };

        const nauseasVal = anam.sintomaNauseas || 'No';
        const vomitosVal = anam.sintomaVomitos || 'No';
        const reflujoVal = anam.sintomaReflujo || 'No';
        const deposicionesVal = anam.sintomaDeposiciones || 'No';
        const distensionVal = anam.sintomaDistension || 'No';
        const gasesVal = anam.sintomaGases || 'No';

        const dentaduraVal = anam.anamnesisDentadura || 'Sí';
        const alergiasVal = anam.anamnesisAlergias || 'No';
        const deglucionVal = anam.anamnesisDeglucion || 'No';
        const apetitoVal = anam.anamnesisApetito || 'Sí';

        // Obtener diagnóstico médico
        const dxMedico = document.getElementById('diagnostico')?.value || p.diagnostico || 'Sin diagnóstico médico';

        // Obtener dietoterapia actual dinámicamente
        let volText = "";
        let modulesText = "";
        const formula = AppState.formulas?.find(f => f.id === AppState.patient.formulaId);
        if (formula) {
            const isBotellin = formula.type === 'l' && (formula.id.includes('botellin') || formula.id.includes('liquido') || formula.id.includes('ready'));
            const vol = parseFloat(document.getElementById('volumen')?.value) || 0;
            volText = isBotellin ? `${vol} Unidad(es) (${vol * formula.volUnit} ml totales)` : `${vol} ml`;
        }

        // Modular supplements details
        const mod1Id = document.getElementById('modularType1')?.value;
        const mod1Pct = parseFloat(document.getElementById('modularPct1')?.value) || 0;
        if (mod1Id && mod1Id !== 'none' && mod1Pct > 0) {
            const modItem = AppState.formulas?.find(f => f.id === mod1Id);
            if (modItem) modulesText += `${modItem.name} al ${mod1Pct}%, `;
        }
        const mod2Id = document.getElementById('modularType2')?.value;
        const mod2Pct = parseFloat(document.getElementById('modularPct2')?.value) || 0;
        if (mod2Id && mod2Id !== 'none' && mod2Pct > 0) {
            const modItem = AppState.formulas?.find(f => f.id === mod2Id);
            if (modItem) modulesText += `${modItem.name} al ${mod2Pct}%, `;
        }

        const valKcalEl = document.getElementById('valKcal');
        const valProtEl = document.getElementById('valProt');
        const totalKcalVal = valKcalEl ? parseFloat(valKcalEl.innerText) || 0 : 0;
        const totalProtVal = valProtEl ? parseFloat(valProtEl.innerText) || 0 : 0;

        const kcalFinal = totalKcalVal > 0 ? Math.round(totalKcalVal) : Math.round(goal);
        const protFinal = totalProtVal > 0 ? totalProtVal.toFixed(1) : pTotal.toFixed(1);

        const pesoAportes = p.pesoAjustado || pesoFisico || 1;
        let aporteStr = `Aporte: ${kcalFinal} kcal`;
        if (pesoAportes > 0) {
            aporteStr += ` (${(kcalFinal / pesoAportes).toFixed(1)} kcal/kg)`;
        }
        aporteStr += ` / ${protFinal} g proteína`;
        if (pesoAportes > 0) {
            aporteStr += ` (${(parseFloat(protFinal) / pesoAportes).toFixed(2)} g/kg)`;
        }

        const dietoterapiaStr = window.generateDietoterapiaString ? window.generateDietoterapiaString(kcalFinal, protFinal, pesoAportes) : (regimenParts.length > 0 ? `${regimenParts.join(' | ')} | ${aporteStr}` : 'Según indicación clínica');

        // Obtener cargo de firma dinámicamente según el servicio seleccionado
        const cargoFirma = window.getVGOServiceSignature ? window.getVGOServiceSignature() : "Nutricionista clínica";

        // Obtener estructura personalizada si existe para este servicio
        const selService = document.getElementById('vgoServiceSelect')?.value || 'uti_cardio_qx';
        let customStructureText = "";
        const savedKey = `vgoCustomStructure_${selService}`;
        const savedDataStr = localStorage.getItem(savedKey);
        if (savedDataStr) {
            try {
                const savedData = JSON.parse(savedDataStr);
                if (savedData.body && savedData.body.trim()) {
                    const headerTitle = savedData.title && savedData.title.trim() ? savedData.title.trim() : 'Campos Adicionales del Servicio';
                    customStructureText = `\n${headerTitle}:\n${savedData.body.trim()}\n`;
                }
            } catch (e) {}
        }

        // Dynamic Anthropometric Indicators & Screening based on Patient Mode
        const pMode = p.type || 'adult';
        const ageValYears = parseFloat(document.getElementById('edad')?.value) || p.edad || 0;

        let indicadoresText = "";
        let tamizajeText = "";
        let clasifIMC = "Normal / Eutrófico";
        let imcNum = parseFloat(imcVal) || (typeof calculatedBmi !== 'undefined' ? calculatedBmi : 0) || (pesoFisico > 0 && cm > 0 ? (pesoFisico / Math.pow(parseFloat(cm) / 100, 2)) : 0);

        if (pMode === 'pediatric') {


            const waistStatus = document.getElementById('valWaistClass')?.innerText || 'No evaluada';

            indicadoresText = `Indicadores nutricionales: (OMS / WHO Anthro Pediátrico)
o IMC: ${imcVal} kg/m²
o Zscore IMC/E o P/T: ${zImcVal} DE
o Zscore T/E: ${zTallaVal} DE
o C. Cintura / E: ${cCintura !== '--' ? `${cCintura} cm (${waistStatus})` : '[Completar si aplica]'}`;

            tamizajeText = `Tamizaje: (STRONGkids)
o Puntaje: ${sk.score || 0} pts
o Interpretación: ${(sk.classification || 'Riesgo bajo').toUpperCase()}`;

        } else if (pMode === 'neonate') {
            const semNac = document.getElementById('egSemanas')?.value || '--';
            const diasNac = document.getElementById('egDias')?.value || '0';
            const pittPeso = document.getElementById('valPittPeso')?.innerText || 'Pittaluga / EG';
            const pittTalla = document.getElementById('valPittTalla')?.innerText || 'Pittaluga / EG';
            const pittCC = document.getElementById('valPittCC')?.innerText || 'Pittaluga / EG';

            indicadoresText = `Indicadores nutricionales: (Curvas Intrauterinas Pittaluga / Fenton)
o EG al nacer: ${semNac} +${diasNac} semanas
o Peso / EG: ${pittPeso}
o Talla / EG: ${pittTalla}
o C. Craneano / EG: ${pittCC}`;

            tamizajeText = `Tamizaje: (Evaluación Neonatal)
o Interpretación: Evaluación según Edad Gestacional y Curvas de Crecimiento Intrauterino`;

        } else {
            // Adult or Adulto Mayor
            const isElderly = ageValYears >= 65;
            
            clasifIMC = "Normal / Eutrófico";
            if (isElderly) {
                // MINSAL Adulto Mayor Criteria (<23 Enflaquecido, 23-27.9 Normal, 28-31.9 Sobrepeso, >=32 Obeso)
                if (imcNum > 0) {
                    if (imcNum < 23) clasifIMC = "Enflaquecido / Deficitario";
                    else if (imcNum < 28) clasifIMC = "Normal / Eutrófico";
                    else if (imcNum < 32) clasifIMC = "Sobrepeso";
                    else clasifIMC = "Obeso";
                }
            } else {
                // OMS Adult Criteria (<18.5 Bajo Peso, 18.5-24.9 Normal, 25-29.9 Sobrepeso, >=30 Obesidad)
                if (imcNum > 0) {
                    if (imcNum < 18.5) clasifIMC = "Bajo Peso / Desnutrición";
                    else if (imcNum < 25) clasifIMC = "Eutrófico / Normal";
                    else if (imcNum < 30) clasifIMC = "Sobrepeso";
                    else if (imcNum < 35) clasifIMC = "Obesidad Grado I";
                    else if (imcNum < 40) clasifIMC = "Obesidad Grado II";
                    else clasifIMC = "Obesidad Grado III (Mórbida)";
                }
            }

            const categoryLabel = isElderly ? "Adulto Mayor - MINSAL" : "Adulto - OMS";
            const waistStatus = document.getElementById('valWaistClass')?.innerText || (cCintura !== '--' ? 'Normal' : 'No evaluada');

            indicadoresText = `Indicadores nutricionales: (${categoryLabel})
o IMC: ${imcNum > 0 ? imcNum.toFixed(1) : imcVal} kg/m² (${clasifIMC})
o C. Cintura: ${cCintura !== '--' ? `${cCintura} cm (${waistStatus})` : 'No evaluado'}`;

            tamizajeText = `Tamizaje: (NRS 2002)
o Puntaje: ${nrs.score || 0} pts
o Interpretación: ${(nrs.classification || 'Sin riesgo nutricional').toUpperCase()}`;
        }

        const isEstimated = (document.getElementById('altrodilla')?.value || document.getElementById('mediaenv')?.value || document.getElementById('pesoCalculoSelect')?.value !== 'real');
        const dataAntropoStr = isEstimated ? '(estimado)' : '(Bipedestado)';
        
        // Risk of LPP
        const riesgoLpp = document.getElementById('riesgo_lpp')?.value || 'Sin evaluar';
        
        // Biochem parameters
        const evoExamenes = document.getElementById('evoExamenes')?.value || 'Sin reportar';

        // Diagnostic
        let diagNutri = `Paciente ${pMode === 'pediatric' ? 'pediátrico' : (pMode === 'neonate' ? 'neonato' : 'adulto')} ${sexStr.toLowerCase()} con estado nutricional ${clasifIMC.toLowerCase()} según IMC.`;
        const compBraquialText = p.amaStatus || p.cbStatus ? ` Con compartimiento braquial ${p.amaStatus || p.cbStatus}.` : '';
        if (compBraquialText) diagNutri += compBraquialText;
        if (des && des !== 'Sin diagnóstico ingresado') {
            diagNutri = des;
        }

        // Factors calculation for Requirements
        const factorKcalVal = reqs.factorKcalVal || (pesoCalc > 0 && goal > 0 ? (goal / pesoCalc).toFixed(0) : 0);
        const factorProtVal = reqs.factorProtVal || (pesoCalc > 0 && pTotal > 0 ? (pTotal / pesoCalc).toFixed(1) : 0);

        // Aporte
        const curKcal = document.getElementById('valKcal')?.innerText || '0';
        const curProt = document.getElementById('valProt')?.innerText || '0';
        const curCho = document.getElementById('valCHO')?.innerText || '0';
        const curLip = document.getElementById('valLip')?.innerText || '0';

        // Format selection
        const selFormatEl = document.getElementById('vgoFormatSelect');
        let selectedFormat = selFormatEl?.value || localStorage.getItem('selectedVGOFormat');
        if (!selectedFormat || selectedFormat === 'pediatric_neo') {
            selectedFormat = pMode === 'neonate' ? 'neonate' : (pMode === 'pediatric' ? 'pediatric' : 'adult_std');
            if (selFormatEl) selFormatEl.value = selectedFormat;
        }

        let vgoText = "";

        if (selectedFormat === 'adult_std') {
            // 1. VGO Adulto Estándar HRA (Hospitalario compacto)
            vgoText = `Valoracion global objetiva
ANTROPOMETRÍA
Datos Antropométricos:  ${dataAntropoStr}
Peso: ${pesoFisico} kg	
Talla: ${tallaMt} mt 				
IMC: ${imcNum > 0 ? imcNum.toFixed(1) : imcVal} kg/m2
Screening nutricional:  ${nrs.score || 0}  pts, ${nrs.score >= 3 ? 'con riesgo de malnutrición.' : 'sin riesgo nutricional.'}  

Valoración de riesgo de LPP: ${riesgoLpp.toUpperCase()}

EXÁMENES DE RELEVANCIA NUTRICIONAL: 
${evoExamenes}

DIAGNÓSTICO NUTRICIONAL: ${diagNutri}

REQUERIMIENTOS NUTRICIONALES 
Calorías: ${Math.round(goal)} kcals (${factorKcalVal} kcal/kg peso)
Proteínas: ${pTotal.toFixed(1)} gr        (${factorProtVal} gr/kg peso)

Aporte: ${curKcal} kcals, ${curProt} gr prot, ${curCho} gr cho, ${curLip} gr lip

DIETOTERAPIA: 
${dietoterapiaStr}
${customStructureText}
Observaciones/Plan:
o Paciente tolerando nutrición
o Producto cubre requerimientos nutricionales calóricos proteicos
o Seguimiento a deposiciones, tolerancia 
o Seguimiento nutricional continuo

_________________
${userName} 
${cargoFirma} 
Unidad de Nutrición
Hospital Regional de Antofagasta`;

        } else if (selectedFormat === 'eval_nutri') {
            // EVALUACIÓN POR NUTRICIONISTA (VALORACION GLOBAL OBJETIVA)
            const alergiasNutri = alergiasVal === 'Sí' ? (anam.alergiasDetalle || 'Presenta alergias') : '-';
            const deglucionNutri = deglucionVal === 'Sí' ? '(+) Presenta trastorno' : '(-)';
            const viaAlim = formula ? 'Enteral' : 'oral';
            const transitoNutri = (deposicionesVal === 'Sí' || deposicionesVal === 'Normal') ? '(+) Conservado' : (deposicionesVal === 'No' ? 'Sin deposiciones' : '(+)');
            const tallaCmVal = cm > 0 ? cm : (tallaMt !== '--' ? Math.round(parseFloat(tallaMt) * 100) : '--');
            const cBraqStr = cBraquialVal && cBraquialVal !== '[Completar]' ? `${cBraquialVal} cm` : 'No evaluado';

            let tamizajeBlock = "";
            if (pMode === 'pediatric' || pMode === 'neonate') {
                tamizajeBlock = `Tamizaje Nutricional STRONGkids:
-	Puntaje: ${sk.score || 0} puntos.
-	Interpretación: ${(sk.classification || 'Riesgo bajo')}`;
            } else {
                tamizajeBlock = `Tamizaje Nutricional NRS 2002:
-	Puntaje: ${nrs.score || 0} puntos.
-	Interpretación: ${(nrs.classification || 'Sin riesgo nutricional')}`;
            }

            vgoText = `EVALUACIÓN POR NUTRICIONISTA
(VALORACION GLOBAL OBJETIVA)

Fecha de evaluación: ${dateStr}
Edad: ${ageStr}

Anamnesis alimentaria nutricional: 
Alergias alimentaria: ${alergiasNutri}
Selectividad alimentaria (-)
Vía de alimentación: ${viaAlim}
Trastorno de deglución: ${deglucionNutri}  
Tránsito intestinal: ${transitoNutri} 

${tamizajeBlock}

Riesgo de LPP según Escala de Braden 
·	${riesgoLpp}

Datos antropométricos: 
-	Peso: ${pesoFisico} Kg  
-	Talla: ${tallaCmVal} cm.
C. Braquial: ${cBraqStr}

Exámenes de relevancia nutricional:
${evoExamenes}

Diagnóstico nutricional integrado:
${diagNutri}

Requerimientos nutricionales 
-	Calorías: ${Math.round(goal)} kcal 🡪 (${factorKcalVal} kcal x kg de peso) 
-	Proteínas: ${pTotal.toFixed(1)} g 🡪 ${pPct}% VCT
-	CHO: ${cTotal.toFixed(1)} g 🡪 ${cPct}% VCT
-	Lípidos: ${lTotal.toFixed(1)} g 🡪 ${lPct}% VCT

Prescripción dietética: 
${dietoterapiaStr}
${customStructureText}
Plan/observaciones:
Paciente con buena tolerancia e ingesta.
Se está cubriendo requerimientos al 100%. 
Seguimiento nutricional diario.  

_________________
${userName}
${cargoFirma}
Unidad de Alimentación y Nutrición
SEDILE-CEFE`;

        } else if (selectedFormat === 'detailed_anam') {
            // 2. VGO Detallada (Anamnesis completa + %VCT + PES)
            vgoText = `VALORACION GLOBAL OBJETIVA POR NUTRICIONISTA

o Fecha de evaluación: ${dateStr}

Fecha de nacimiento: ${fNacStr}
N° Ficha: ${numFicha}
Edad: ${ageStr}
Sexo: ${sexStr}

Diagnóstico:
o 1. ${dxMedico}
o Antecedentes Mórbidos: ${antecedentesMorbidos}

Antropometría: (Evaluación ${dataAntropoStr.toLowerCase()} por nutricionista del servicio)
o Peso actual: ${pesoFisico} kg
o Talla: ${tallaMt} mt
o IMC: ${imcNum > 0 ? imcNum.toFixed(1) : imcVal} kg/m² (${clasifIMC})
o C. braquial: ${cBraquialVal} cm
o C. cintura: ${cCintura} cm

${indicadoresText}

Anamnesis:
o Síntomas gastrointestinales: Nauseas (${nauseasVal}) Vómitos (${vomitosVal}) Reflujo gastroesofágico (${reflujoVal}) Deposiciones (${deposicionesVal}) Distensión abdominal (${distensionVal}) Gases (${gasesVal}).
o Anamnesis alimentaria: Dentadura (${dentaduraVal}) Alergias/intolerancias alimentarias (${alergiasVal}) Trastorno de deglución (${deglucionVal}) Apetito (${apetitoVal}).

${tamizajeText}
o Valoración riesgo LPP: ${riesgoLpp.toUpperCase()}

Exámenes de relevancia:
${evoExamenes}

Diagnóstico Nutricional Integrado:
o ${diagNutri}

Requerimientos nutricionales:
o Calorías: ${Math.round(goal)} kcal (${factorKcalVal} kcal/kg)
o Proteínas: ${pTotal.toFixed(1)} gr -> VCT ${pPct} % (${factorProtVal} g/kg)
o Carbohidratos: ${cTotal.toFixed(1)} gr -> VCT ${cPct} %
o Lípidos: ${lTotal.toFixed(1)} gr -> VCT ${lPct} %

Aporte actual: ${curKcal} kcal | P: ${curProt} g | CHO: ${curCho} g | LIP: ${curLip} g

Dietoterapia actual:
o ${dietoterapiaStr}
${customStructureText}
Observaciones/Plan/Sugerencias:
o Monitorización diaria de ingesta y tolerancia enteral/oral
o Balance hídrico y vigilar tránsito intestinal
o Ajuste según evolución clínica y metabólica

_________________
${userName}
${cargoFirma}
Unidad de Nutrición y Alimentación
Hospital Regional de Antofagasta`;

        } else if (selectedFormat === 'pediatric') {
            // 4. VGO Pediátrica
            vgoText = `VALORACIÓN GLOBAL OBJETIVA PEDIÁTRICA

o Fecha de evaluación: ${dateStr}
o Nombre/Ficha: ${p.nombre || 'Paciente'} | Ficha: ${numFicha}
o Edad: ${ageStr} | Sexo: ${sexStr}
o Diagnóstico Médico: ${dxMedico}

ANTROPOMETRÍA Y CRECIMIENTO:
o Peso actual: ${pesoFisico} kg | Talla: ${tallaMt} mt
${indicadoresText}

${tamizajeText}

TOLERANCIA Y SÍNTOMAS:
o Síntomas digestivos: Vómitos (${vomitosVal}), Regurgitaciones (${reflujoVal}), Deposiciones (${deposicionesVal}), Distensión (${distensionVal}).
o Vía de alimentación: ${dietoterapiaStr}

DIAGNÓSTICO NUTRICIONAL:
o ${diagNutri}

METAS Y APORTE NUTRICIONAL:
o Requerimiento Calórico: ${Math.round(goal)} kcal (${factorKcalVal} kcal/kg/día)
o Requerimiento Proteico: ${pTotal.toFixed(1)} g (${factorProtVal} g/kg/día)
o Aporte entregado: ${curKcal} kcal | Prot: ${curProt} g | CHO: ${curCho} g | Lípidos: ${curLip} g
${customStructureText}
PLAN Y RECOMENDACIONES:
o Mantener esquema de alimentación según indicación médica/nutricional.
o Control diario de tolerancia digestiva y curva ponderal.
o Registro estricto de volúmenes administrados en hoja de enfermería / SEDILE.

_________________
${userName}
${cargoFirma}
Nutrición Pediátrica
Hospital Regional de Antofagasta`;

        } else if (selectedFormat === 'neonate') {
            // 5. EVALUACIÓN NUTRICIONAL (Neonatología)
            const semNacer = parseInt(document.getElementById('egSemanas')?.value) || 0;
            const diasNacer = parseInt(document.getElementById('egDias')?.value) || 0;

            // FNC (Fecha de Nacimiento Corregida / 40 semanas)
            let fncStr = "--";
            let ecStr = "--";
            let egcStr = "--";
            if (fnVal) {
                const [fy, fm, fd] = fnVal.split('-').map(Number);
                const bDate = new Date(fy, fm - 1, fd);
                const today = new Date();
                const diffMs = today.getTime() - bDate.getTime();
                const diffDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
                ecStr = `${diffDays} días`;

                if (semNacer > 0) {
                    const termDays = ((40 - semNacer) * 7) - diasNacer;
                    const fncDate = new Date(bDate.getTime() + (termDays * 24 * 60 * 60 * 1000));
                    fncStr = fncDate.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

                    const totalDaysGestCorr = (semNacer * 7) + diasNacer + diffDays;
                    const semGestCorr = Math.floor(totalDaysGestCorr / 7);
                    const diasGestCorr = totalDaysGestCorr % 7;
                    egcStr = `${semGestCorr} Sem${diasGestCorr > 0 ? ` + ${diasGestCorr} día${diasGestCorr !== 1 ? 's' : ''}` : ''}`;
                }
            }

            // Anthropometrics
            const wG = pesoFisico > 0 ? (pesoFisico < 10 ? Math.round(pesoFisico * 1000) : Math.round(pesoFisico)) : 0;
            const pesoKgNeo = pesoFisico > 0 ? (pesoFisico < 10 ? pesoFisico : pesoFisico / 1000) : 0;
            const tallaNeo = cm > 0 ? cm : (tallaMt !== '--' ? Math.round(parseFloat(tallaMt) * 100) : 0);
            const pcNeo = parseFloat(document.getElementById('pcefalico')?.value) || 0;

            const pnStr = p.pesoNacimiento || p.pn || (wG > 0 ? `${wG} gr` : '--');
            const tnStr = p.tallaNacimiento || p.tn || (tallaNeo > 0 ? `${tallaNeo} cm` : '--');
            const pcnStr = p.pcNacimiento || p.pcn || (pcNeo > 0 ? `${pcNeo} cm` : '--');

            // Pittaluga indicators
            let pittPesoStr = "< Percentil 3";
            let pittTallaStr = "< Percentil 10";
            let pittPcStr = "< Percentil 10";
            if (semNacer >= 24 && semNacer <= 42 && window.PITTALUGA_DATA) {
                const wRefs = window.PITTALUGA_DATA.peso ? window.PITTALUGA_DATA.peso[semNacer] : null;
                if (wRefs && wG > 0) {
                    if (wG < wRefs.p3) pittPesoStr = "< Percentil 3";
                    else if (wG < wRefs.p10) pittPesoStr = "< Percentil 10";
                    else if (wG <= wRefs.p90) pittPesoStr = "Percentil 10 - 90";
                    else pittPesoStr = "> Percentil 90";
                }
                const tRefs = window.PITTALUGA_DATA.talla ? window.PITTALUGA_DATA.talla[semNacer] : null;
                if (tRefs && tallaNeo > 0) {
                    if (tallaNeo < tRefs.p10) pittTallaStr = "< Percentil 10";
                    else if (tallaNeo <= tRefs.p90) pittTallaStr = "Percentil 10 - 90";
                    else pittTallaStr = "> Percentil 90";
                }
                const pcRefs = window.PITTALUGA_DATA.pc ? window.PITTALUGA_DATA.pc[semNacer] : null;
                if (pcRefs && pcNeo > 0) {
                    if (pcNeo < pcRefs.p10) pittPcStr = "< Percentil 10";
                    else if (pcNeo <= pcRefs.p90) pittPcStr = "Percentil 10 - 90";
                    else pittPcStr = "> Percentil 90";
                }
            }

            // Diagnóstico Nutricional
            let diagNutriNeo = des && des !== 'Sin diagnóstico ingresado' ? des : '';
            if (!diagNutriNeo) {
                let premText = semNacer > 0 ? (semNacer < 28 ? `Prematuro extremo ${semNacer} SG` : (semNacer < 32 ? `Prematuro moderado ${semNacer} SG` : (semNacer < 37 ? `Prematuro tardío ${semNacer} SG` : 'Recién nacido de término'))) : 'Neonato';
                let pesoText = wG > 0 ? (wG < 1000 ? 'con peso extremadamente bajo al nacer <1000 gr' : (wG < 1500 ? 'con muy bajo peso al nacer <1500 gr' : (wG < 2500 ? 'con bajo peso al nacer <2500 gr' : 'con peso adecuado'))) : '';
                diagNutriNeo = `${premText}${pesoText ? `, ${pesoText}` : ''}. Hoy se encuentra con desnutrición según parámetro P/E y L/E.`;
            }

            // Micronutrientes (Calcio y Fósforo)
            const caKg = 150;
            const fKg = 100;
            const caTot = pesoKgNeo > 0 ? Math.round(caKg * pesoKgNeo) : 120;
            const fTot = pesoKgNeo > 0 ? Math.round(fKg * pesoKgNeo) : 87;

            // Prescripción dietética
            const volToma = parseFloat(document.getElementById('volumen')?.value) || 0;
            const vecesToma = parseInt(document.getElementById('volumeTimes')?.value) || 8;
            const hrsInterval = vecesToma > 0 ? Math.round(24 / vecesToma) : 3;
            const totalVol = volToma > 0 ? (volToma * vecesToma) : (parseFloat(document.getElementById('volumeTotalDisplay')?.innerText) || 0);
            const volKg = pesoKgNeo > 0 && totalVol > 0 ? Math.round(totalVol / pesoKgNeo) : 0;

            let nomPrescrip = formula ? `${formula.name}${document.getElementById('dilution')?.value ? ` ${document.getElementById('dilution').value}%` : ''}` : 'LMF 4% exclusiva';
            let prescripDietNeo = `${nomPrescrip}  ${volToma > 0 ? `${volToma} cc` : '17 cc'} cada ${hrsInterval} hrs por ${vecesToma} veces al día`;
            let volTotalNeo = totalVol > 0 ? totalVol : 136;
            let volTotalNeoKg = volKg > 0 ? volKg : 156;

            const fnDisplay = semNacer > 0 ? `${fNacStr} (${semNacer} Sem${diasNacer > 0 ? ` + ${diasNacer} d` : ''})` : fNacStr;

            vgoText = `EVALUACIÓN NUTRICIONAL

Nombre: ${p.nombre || 'Sin nombre ingresado'}                               Ficha: ${numFicha}
FN: ${fnDisplay}                                 FNC:  ${fncStr}  
EC: ${ecStr}                     EGC: ${egcStr}                                                          
                                                     
Dg Médico: ${dxMedico}

Anamnesis: ${anam.anamnesisGeneral || ''}

Datos Antropométricos:
Peso: ${wG > 0 ? `${wG} gr` : `${pesoFisico} kg`}                                PN: ${pnStr.includes('gr') ? pnStr : `${pnStr} gr`}
Talla: ${tallaNeo > 0 ? `${tallaNeo} cm` : `${tallaMt} mt`}                                 TN: ${tnStr.includes('cm') ? tnStr : `${tnStr} cm`}
Pc: ${pcNeo > 0 ? `${pcNeo} cm` : '--'}                                     PcN: ${pcnStr.includes('cm') ? pcnStr : `${pcnStr} cm`}
 
Indicadores:
Según curvas Alarcon-Pittaluga
P/E:    ${pittPesoStr}
L/E:    ${pittTallaStr}
Pc/E:   ${pittPcStr}

Diagnóstico Nutricional:
${diagNutriNeo}

Cálculo de Requerimientos: Según Fórmula Factorial
Calorías:    ${Math.round(goal)} kcals      (${factorKcalVal} kcal/kg/día)              
Proteínas:      ${pTotal.toFixed(1)} gr/día    (${factorProtVal} gr/kg/día)                   ${pPct}% VCT
Cho:             ${cTotal.toFixed(1)} gr/día                                               ${cPct}% VCT
Lípidos:          ${lTotal.toFixed(1)} gr/día                                               ${lPct}% VCT
Calcio:        ${caTot} mg/día (${caKg} mg/kg/día)
Fósforo:        ${fTot} mg/día (${fKg} mg/kg/día)

Sugerencia Prescripción Dietética:  
${prescripDietNeo}
Volumen total: ${volTotalNeo} cc (${volTotalNeoKg} cc/kg/día)

Observaciones:
${customStructureText || ''}
  - Nutricionista UPC Neonatal`;

        } else {
            // 4. Evolución Nutricional Rápida ('quick_evo')
            vgoText = `EVOLUCIÓN NUTRICIONAL

Fecha: ${dateStr} | Ficha: ${numFicha} | Paciente: ${p.nombre || 'Adulto'} (${sexStr}, ${ageStr})
Diagnóstico Nutricional: ${diagNutri}

ANTROPOMETRÍA:
o Peso: ${pesoFisico} kg | Talla: ${tallaMt} mt | IMC: ${imcNum > 0 ? imcNum.toFixed(1) : imcVal} kg/m² (${clasifIMC})
o Tamizaje Nutricional: ${nrs.score || 0} pts (${nrs.score >= 3 ? 'En Riesgo' : 'Sin Riesgo'})

METAS Y RÉGIMEN ACTUAL:
o Requerimientos: ${Math.round(goal)} kcal (${factorKcalVal} kcal/kg) | Prot: ${pTotal.toFixed(1)} g (${factorProtVal} g/kg)
o Régimen/Fórmula: ${dietoterapiaStr}
o Aporte: ${curKcal} kcal | P: ${curProt} g | CHO: ${curCho} g | L: ${curLip} g
${customStructureText}
PLAN:
o Tolerando indicación nutricional actual.
o Continuar según evolución clínica y monitoreo de ingesta.

_________________
${userName}
${cargoFirma} - Unidad de Nutrición HRA`;
        }

        content.innerText = vgoText;
        if (typeof window.updateNoteStyle === 'function') {
            window.updateNoteStyle();
        }
        const titleH4 = document.querySelector('#clinicalNoteContainer h4');
        if (titleH4) titleH4.innerText = "Vista Previa de Evolución (VGO)";
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });

        // Auto-mark patient as having VGO completed (and reset 7-day timer)
        if (AppState.patient) {
            AppState.patient.metadata = AppState.patient.metadata || {};
            AppState.patient.metadata.has_vgo = true;
            AppState.patient.metadata.fecha_vgo = new Date().toISOString();
            AppState.patient.metadata.fecha_evaluacion = new Date().toISOString();
            AppState.patient.evaluado = true;
            if (typeof window.savePatientToLocalStorage === 'function') {
                window.savePatientToLocalStorage(AppState.patient);
            }
            if (typeof supabaseClient !== 'undefined' && supabaseClient && AppState.patient.id && !String(AppState.patient.id).startsWith('pat_')) {
                supabaseClient.from('pacientes').update({
                    evaluado: true,
                    metadata: AppState.patient.metadata,
                    updated_at: new Date()
                }).eq('id', AppState.patient.id).then(() => {});
            }
        }
    };

    const btnVGO = document.getElementById('btnGenerateVGO');
    if (btnVGO) btnVGO.onclick = window.generateVGO;

// --- VGO FORMAT PREFERENCE HANDLERS ---
window.updateVGOFormatPreference = function () {
    const sel = document.getElementById('vgoFormatSelect');
    if (!sel) return;
    localStorage.setItem('selectedVGOFormat', sel.value);
};

window.initVGOFormatPreference = function () {
    const sel = document.getElementById('vgoFormatSelect');
    if (!sel) return;
    const saved = localStorage.getItem('selectedVGOFormat');
    if (saved && sel.querySelector(`option[value="${saved}"]`)) {
        sel.value = saved;
    }
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initVGOFormatPreference);
} else {
    window.initVGOFormatPreference();
}

// --- VGO SERVICE & CUSTOM STRUCTURE HANDLERS ---
window.updateVGOServiceConfig = function () {
    const sel = document.getElementById('vgoServiceSelect');
    const customWrapper = document.getElementById('vgoCustomServiceWrapper');
    if (!sel) return;

    const val = sel.value;
    if (customWrapper) {
        customWrapper.style.display = val === 'custom' ? 'block' : 'none';
    }
    localStorage.setItem('selectedVGOService', val);
};

window.getVGOServiceSignature = function () {
    const sel = document.getElementById('vgoServiceSelect');
    const customInput = document.getElementById('vgoCustomServiceInput');
    const selectedVal = sel?.value || localStorage.getItem('selectedVGOService') || 'uti_cardio_qx';

    const serviceMap = {
        'uti_cardio_qx': 'Nutricionista UTI Cardio Qx',
        'uci_adulto': 'Nutricionista UCI Adultos',
        'tim_adulto': 'Nutricionista TIM Adultos',
        'uco': 'Nutricionista UCI Coronaria (UCO)',
        'uciped': 'Nutricionista UCIPED',
        'timped': 'Nutricionista TIMPED',
        'oncologia_pediatrica': 'Nutricionista Oncología Pediátrica',
        'pediatria': 'Nutricionista clínica pediatría',
        'cirugia_infantil': 'Nutricionista clínica cirugía infantil',
        'neonatologia': 'Nutricionista clínica neonatología',
        'urgencias': 'Nutricionista Unidad de Emergencia',
        'aro': 'Nutricionista clínica ARO',
        'ginecologia': 'Nutricionista clínica ginecología',
        'puerperio': 'Nutricionista clínica puerperio',
        'oncologia_adultos': 'Nutricionista Oncología Adultos',
        'cirugia_adultos': 'Nutricionista Cirugía UCM',
        'medicina_adultos': 'Nutricionista clínica medicina',
        'psiquiatria': 'Nutricionista Psiquiatría Adultos'
    };

    if (selectedVal === 'custom') {
        const customVal = customInput?.value || localStorage.getItem('vgoCustomServiceTitle') || '';
        if (customVal.trim()) {
            localStorage.setItem('vgoCustomServiceTitle', customVal.trim());
            return customVal.trim();
        }
        return 'Nutricionista clínica';
    }

    return serviceMap[selectedVal] || 'Nutricionista clínica';
};

window.openVGOStructureModal = function () {
    const modal = document.getElementById('vgoStructureModal');
    const sel = document.getElementById('vgoServiceSelect');
    const serviceNameEl = document.getElementById('modalVgoServiceName');
    const titleInp = document.getElementById('vgoCustomSectionTitle');
    const bodyInp = document.getElementById('vgoCustomSectionBody');

    if (!modal || !sel) return;

    const currentService = sel.value;
    const serviceText = sel.options[sel.selectedIndex]?.text || currentService;
    if (serviceNameEl) serviceNameEl.value = serviceText;

    // Load saved structure for this service
    const savedKey = `vgoCustomStructure_${currentService}`;
    const savedDataStr = localStorage.getItem(savedKey);
    if (savedDataStr) {
        try {
            const savedData = JSON.parse(savedDataStr);
            if (titleInp) titleInp.value = savedData.title || '';
            if (bodyInp) bodyInp.value = savedData.body || '';
        } catch (e) {
            if (titleInp) titleInp.value = '';
            if (bodyInp) bodyInp.value = '';
        }
    } else {
        if (titleInp) titleInp.value = '';
        if (bodyInp) bodyInp.value = '';
    }

    modal.style.display = 'flex';
};

window.closeVGOStructureModal = function () {
    const modal = document.getElementById('vgoStructureModal');
    if (modal) modal.style.display = 'none';
};

window.saveVGOStructureCustomization = function () {
    const sel = document.getElementById('vgoServiceSelect');
    const titleInp = document.getElementById('vgoCustomSectionTitle');
    const bodyInp = document.getElementById('vgoCustomSectionBody');
    if (!sel) return;

    const currentService = sel.value;
    const savedKey = `vgoCustomStructure_${currentService}`;
    const payload = {
        title: titleInp?.value.trim() || '',
        body: bodyInp?.value.trim() || ''
    };

    localStorage.setItem(savedKey, JSON.stringify(payload));
    alert(`✅ Estructura personalizada guardada para el servicio: ${sel.options[sel.selectedIndex]?.text}`);
    window.closeVGOStructureModal();
};

    // Copy Button
    const btnCopy = document.getElementById('btnCopyNote');
    if (btnCopy) btnCopy.onclick = () => {
        const text = document.getElementById('noteContent').innerText;
        navigator.clipboard.writeText(text).then(() => alert("Nota clínica copiada al portapapeles."));
    };

    // Module Input Watcher
    document.querySelectorAll('.input-module').forEach(inp => {
        inp.oninput = () => {
            if (typeof window.runSimulation === 'function') window.runSimulation();
        };
    });

}


// Global helper for Factorial
function calcFactorial() {
    const inpFactor = document.getElementById('factorKcal');
    if (!inpFactor) return;

    const f = parseFloat(inpFactor.value) || 0;
    const pObj = AppState.patient || {};
    const inputPeso = document.getElementById('peso');
    const ptWeight = parseFloat(inputPeso ? inputPeso.value : 0) || pObj.peso_calculo || pObj.peso || 0;
    const res = Math.round(f * ptWeight);

    const resBadge = document.getElementById('resFactorial');
    if (resBadge) resBadge.innerText = `${res} kcal`;
}

function calcTMB_OMS() {
    const p = AppState.patient;
    const method = document.getElementById('tmbMethod').value;
    const sexo = document.getElementById('sexo').value;
    const age = p.edad || parseFloat(document.getElementById('edad').value) || 0;
    const inputPeso = document.getElementById('peso');
    const weight = parseFloat(inputPeso ? inputPeso.value : 0) || p.peso_calculo || p.peso || 0;
    const height = p.estatura || parseFloat(document.getElementById('estatura').value) || 0;

    if (age <= 0 || weight <= 0) return;

    let tmb = 0;
    let overrideGET = false;

    // Phase 10: Poblaciones Especiales overrides
    const specCond = document.getElementById('specialCondition')?.value || 'none';
    const isPediatric = (p.type === 'pediatric' || document.getElementById('ptPediatric')?.checked);

    if (isPediatric && specCond.startsWith('cp_')) {
        let factor = 10; // GMFCS V
        if (specCond === 'cp_i_ii') factor = 14.0;
        else if (specCond === 'cp_iii_iv') factor = 11.1;

        const cm = height > 3 ? height : height * 100;
        tmb = factor * cm;

        p.tmb = tmb;
        const resBadge = document.getElementById('resTMB');
        if (resBadge) {
            resBadge.innerText = `${Math.round(tmb)} kcal (PC: ${factor} kcal/cm)`;
            resBadge.style.background = '#8e44ad';
            resBadge.style.color = '#fff';
        }

        // This is total GET, so update GET explicitly
        const getVal = document.getElementById('valGET');
        if (getVal) getVal.innerHTML = `${Math.round(tmb)} kcal <span style="font-size:0.6rem;">(Krick)</span>`;
        return;
    } else {
        const resBadge = document.getElementById('resTMB');
        if (resBadge) {
            resBadge.style.background = '#e3f2fd';
            resBadge.style.color = '#1565c0';
        }
    }

    if (method === 'oms') {
        if (sexo === 'm') {
            if (age < 3) tmb = 60.9 * weight - 54;
            else if (age < 10) tmb = 22.7 * weight + 495;
            else if (age < 18) tmb = 17.5 * weight + 651;
            else if (age < 30) tmb = 15.3 * weight + 679;
            else if (age < 60) tmb = 11.6 * weight + 879;
            else tmb = 13.5 * weight + 487;
        } else {
            if (age < 3) tmb = 61.0 * weight - 51;
            else if (age < 10) tmb = 22.5 * weight + 499;
            else if (age < 18) tmb = 12.2 * weight + 746;
            else if (age < 30) tmb = 14.7 * weight + 496;
            else if (age < 60) tmb = 8.7 * weight + 829;
            else tmb = 10.5 * weight + 596;
        }
    } else if (method === 'hb') {
        // Harris-Benedict (Original 1919 Clásica)
        const heightCm = height > 3 ? height : height * 100;
        if (sexo === 'm') {
            tmb = 66.47 + (13.75 * weight) + (5.0 * heightCm) - (6.75 * age);
        } else {
            tmb = 655.09 + (9.56 * weight) + (1.84 * heightCm) - (4.67 * age);
        }
    } else if (method === 'schofield') {
        if (sexo === 'm') {
            if (age < 3) tmb = 59.512 * weight - 30.4;
            else if (age < 10) tmb = 22.706 * weight + 504.3;
            else if (age < 18) tmb = 17.686 * weight + 658.2;
            else if (age < 30) tmb = 15.057 * weight + 692.2;
            else if (age < 60) tmb = 11.472 * weight + 873.1;
            else tmb = 11.711 * weight + 587.7;
        } else {
            if (age < 3) tmb = 58.317 * weight - 31.1;
            else if (age < 10) tmb = 20.315 * weight + 485.9;
            else if (age < 18) tmb = 13.384 * weight + 692.6;
            else if (age < 30) tmb = 14.818 * weight + 486.6;
            else if (age < 60) tmb = 8.126 * weight + 845.6;
            else tmb = 9.082 * weight + 658.5;
        }
    } else if (method === 'valencia') {
        // Valencia (América Latina)
        if (sexo === 'm') {
            if (age < 30) tmb = (13.37 * weight) + 747;
            else if (age < 60) tmb = (11.02 * weight) + 679;
            else tmb = (10.92 * weight) + 510;
        } else {
            if (age < 30) tmb = (11.02 * weight) + 679;
            else if (age < 60) tmb = (10.92 * weight) + 510;
            else tmb = (10.98 * weight) + 520;
        }
    } else if (method === 'rozashizgal') {
        // Roza y Shizgal (Harris-Benedict Revisada 1984)
        if (sexo === 'm') {
            tmb = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            tmb = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
    } else if (method === 'owen') {
        // Owen (1986)
        if (sexo === 'm') {
            tmb = 879 + (10.2 * weight);
        } else {
            tmb = 795 + (7.18 * weight);
        }

    } else if (method === 'msj') {
        // Mifflin-St Jeor
        if (sexo === 'm') {
            tmb = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            tmb = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
    }

    const tmbRes = Math.round(tmb);
    document.getElementById('resTMB').innerText = `${tmbRes} kcal`;

    // Calculate GET
    const activity = parseFloat(document.getElementById('actividad')?.value) || 1.2;
    const get = Math.round(tmbRes * activity);
    document.getElementById('valGET').innerText = `${get} kcal`;
}

function calcDryWeight() {
    if (typeof window.updateDryWeight === 'function') {
        window.updateDryWeight();
    }
}

// --- 18. BIOCHEMICAL EXAMS HELPERS ---
function addExamRow() {
    const container = document.getElementById('examsContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'exam-row';
    row.innerHTML = `
        <input type="date">
        <input type="text" placeholder="Examen (Ej: Albúmina)">
        <input type="text" placeholder="Resultado">
        <button class="btn-row-del" onclick="this.parentElement.remove()" title="Eliminar examen">🗑️</button>
    `;
    container.appendChild(row);
}

function calcNitrogenBalance() {
    const nuu = parseFloat(document.getElementById('valNUU').value);
    const protIngested = parseFloat(document.getElementById('valProt').innerText); // From simulator
    const factor = parseFloat(document.getElementById('valNFactor').value) || 4;

    const resDiv = document.getElementById('bnResult');

    if (!nuu || !protIngested) {
        resDiv.innerText = "Faltan datos (NUU o Prot)";
        resDiv.style.color = "#666";
        return;
    }

    const bn = (protIngested / 6.25) - (nuu + factor);
    const txt = bn > 0 ? "Anabolismo" : "Catabolismo";
    const color = bn > 0 ? "#22c55e" : "#ef4444";

    resDiv.innerHTML = `BN: <strong>${bn.toFixed(1)} g</strong> (<span style="color:${color}">${txt}</span>)`;
}

// Simple Frisancho Classification (Mock for demo - ideally needs full JSON)
// We listen to input changes for color coding
document.querySelectorAll('.input-watch').forEach(imp => {
    imp.addEventListener('input', (e) => {
        // Logic would go here. For now validation only.
        // We will simple color badge based on arbitrary ranges for demo, 
        // asking user to implement full table if strictly needed later.
    });
});

// --- NUTRI IA (🦦 V3.23) ---
const GEMINI_API_KEY = (typeof window_GEMINI_API_KEY !== 'undefined' && window_GEMINI_API_KEY) ? window_GEMINI_API_KEY : '';

function initNutriIA() {
    const btnGenerate = document.getElementById('btnGenerateIA');
    if (btnGenerate) {
        btnGenerate.addEventListener('click', generateNutriIAAnalysis);
    }

    // Tab integration for visibility
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.view === 'nutri-ia') {
                const resultBox = document.getElementById('iaResultContainer');
                const welcomeBox = document.getElementById('iaInitialState');
                if (resultBox && resultBox.style.display === 'none' && welcomeBox) {
                    welcomeBox.style.display = 'block';
                }
            }
        });
    });
}

async function generateNutriIAAnalysis() {
    const btn = document.getElementById('btnGenerateIA');
    const label = document.getElementById('iaBtnLabel');
    const spinner = document.getElementById('iaSpinner');
    const resultBox = document.getElementById('iaResultContainer');
    const welcomeBox = document.getElementById('iaInitialState');

    if (!btn || !resultBox) return;

    btn.disabled = true;
    if (label) label.style.display = 'none';
    if (spinner) spinner.style.display = 'block';

    try {
        const prompt = constructNutriIAPrompt();
        const response = await callGeminiAPI(prompt);

        if (welcomeBox) welcomeBox.style.display = 'none';
        resultBox.style.display = 'block';
        resultBox.innerHTML = formatIAResponse(response);

        // PERSISTENCE V3.27: Save to Supabase if patient is loaded
        if (AppState.patient.id) {
            await supabaseClient.from('pacientes')
                .update({ ia_report: response })
                .eq('id', AppState.patient.id);
            AppState.patient.ia_report = response;
            console.log("IA Report persisted for patient:", AppState.patient.id);
        }

    } catch (err) {
        console.error("🔴 Error Nutri IA Detallado:", err);
        let userMsg = err.message || "Error al conectar con Nutria IA. Ingresa tu clave válida de Gemini.";
        alert(userMsg);
    } finally {
        btn.disabled = false;
        if (label) label.style.display = 'block';
        if (spinner) spinner.style.display = 'none';
    }
}

function constructNutriIAPrompt() {
    const p = AppState.patient;
    const context = {
        antropometria: {
            peso: p.peso, talla: p.estatura, bmi: p.bmi,
            pesoIdeal: document.getElementById('valIdealWeight')?.innerText,
            ipt: document.getElementById('valIPT')?.innerText,
            diagnosticoIPT: document.getElementById('valIPTClass')?.innerText,
            cintura: document.getElementById('ccintura')?.value,
            braquial: document.getElementById('cbraquial')?.value,
            chumlea: document.getElementById('valChumleaWeight')?.value,
            ross: document.getElementById('valRossStature')?.value
        },
        bioquimica: Array.from(document.querySelectorAll('#examsContainer .exam-row')).map(row => {
            const inputs = row.querySelectorAll('input');
            return { fecha: inputs[0]?.value, examen: inputs[1]?.value, valor: inputs[2]?.value };
        }).filter(e => e.examen),
        riesgo: {
            nrs2002: AppState.patient?.nrs2002 ? `${AppState.patient.nrs2002.score || 0} pts (${AppState.patient.nrs2002.classification || ''})` : (document.getElementById('nrsTotalScore')?.innerText ? `${document.getElementById('nrsTotalScore').innerText} pts (${document.getElementById('nrsClassif')?.innerText || ''})` : document.getElementById('nrs2002')?.value || "No evaluado"),
            strongkids: AppState.patient?.strongkids ? `${AppState.patient.strongkids.score || 0} pts (${AppState.patient.strongkids.classification || ''})` : "No evaluado",
            vgs: document.getElementById('vgs')?.value
        },
        tolerancia: {
            residuo: document.getElementById('residuo')?.value,
            diarrea: document.getElementById('diarrea')?.value,
            distension: document.getElementById('distension')?.value
        },
        accesos: { tipo: document.getElementById('accesoTipo')?.value, fecha: document.getElementById('accesoFecha')?.value },
        diagnosticoIntegrado: document.getElementById('diagnosticoPES')?.value,
        metas: { kcalKg: document.getElementById('goalKcalBox')?.value, kcalTotal: document.getElementById('goalTotal')?.value }
    };

    return `Actúa como un Nutricionista Clínico experto del Hospital Regional de Antofagasta (HRA), Chile.
Genera un informe clínico profesional fundamentado en estos datos:
- Paciente: ${p.nombre || 'N/A'}, ${p.edad} años, ${p.sexo === 'm' ? 'M' : 'F'}.
- Antropometría: IMC ${context.antropometria.bmi}, Peso Ideal ${context.antropometria.pesoIdeal}, IPT ${context.antropometria.ipt} (${context.antropometria.diagnosticoIPT}).
- Cribado: NRS-2002: ${context.riesgo.nrs2002}, VGS: ${context.riesgo.vgs}.
- Laboratorio: ${JSON.stringify(context.bioquimica)}.
- Tolerancia GI: Residuo ${context.tolerancia.residuo}, Diarrea ${context.tolerancia.diarrea}, Distensión ${context.tolerancia.distension}.
- Diagnóstico PES: ${context.diagnosticoIntegrado}.
- Meta actual: ${context.metas.kcalTotal} kcal/día (${context.metas.kcalKg} kcal/kg).

INFORME REQUERIDO:
1. Resumen de Hallazgos Clínicos.
2. Análisis de Bioquímica y Tolerancia.
3. Plan Nutricional Sugerido (Energía, Prot, Fórmulas).
4. Recomendaciones según protocolos HRA Antofagasta.

Tono profesional y estructurado. Usa HTML (h3, p, ul, li).`;
}

async function callGeminiAPI(prompt) {
    let apiKey = window.getGeminiApiKey();
    if (!apiKey) {
        window.openGeminiApiKeyModal();
        throw new Error("Por favor ingresa tu API Key de Gemini en la pantalla emergente.");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error?.message || res.statusText || 'Error de API';
        localStorage.removeItem('user_gemini_api_key');
        window.openGeminiApiKeyModal();
        throw new Error(`Error ${res.status}: ${msg}. Se ha abierto la ventana para ingresar tu clave válida de Gemini.`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error al generar análisis.";
}

function formatIAResponse(text) {
    let formatted = text.replace(/```html/g, '').replace(/```/g, '').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    return `<div class="ia-report-content">${formatted}</div>
            <div style="margin-top:20px; border-top:1px dashed #ccc; padding-top:10px; font-size:0.7rem; color:#666;">
                <i>*Sugerencia clínica IA - Validar con profesional HRA.</i>
            </div>`;
}

// --- 18. VOICE DICTATION (NEW V3.60) ---
function initVoiceDictation() {
    const btnMic = document.getElementById('btnMicPES');
    const txtPES = document.getElementById('diagnosticoPES');
    const micStatus = document.getElementById('micStatus');

    if (!btnMic || !txtPES) return;

    // Check compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        btnMic.style.display = 'none'; // Hide if browser doesn't support
        console.warn("Speech API not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CL'; // Chilean Spanish
    recognition.interimResults = true; // Show words as they are spoken
    recognition.continuous = false; // Stop when the user stops talking

    let isRecording = false;

    // Toggle logic
    btnMic.onclick = () => {
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    recognition.onstart = () => {
        isRecording = true;
        if (micStatus) micStatus.innerText = "Escuchando...";
        btnMic.style.background = 'rgba(231, 76, 60, 0.1)';
        btnMic.style.color = '#e74c3c';
        btnMic.style.borderColor = '#e74c3c';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript !== '') {
            const currentText = txtPES.value.trim();
            txtPES.value = currentText ? currentText + ' ' + finalTranscript : finalTranscript;
        }
    };

    // If there is no input after starting
    recognition.onspeechend = () => {
        recognition.stop();
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
            alert("Acceso al micrófono denegado. Por favor dale permiso al navegador.");
        }
        recognition.stop();
    };

    recognition.onend = () => {
        isRecording = false;
        if (micStatus) micStatus.innerText = "Dictar";
        btnMic.style.background = 'transparent';
        btnMic.style.color = 'var(--primary)';
        btnMic.style.borderColor = 'var(--primary)';
    };
}

// --- 19. MACRONUTRIENT GOALS (NEW V3.63) ---

function initGoalMacroChart() {
    const ctx = document.getElementById('goalMacroChart')?.getContext('2d');
    if (!ctx) return;

    goalChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Proteínas', 'Carbohidratos', 'Lípidos'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#e74c3c', '#f1c40f', '#3498db'],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: showExternalTooltip,
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${Math.round(ctx.raw)} kcal`
                    }
                }
            }
        }
    });

    const inputs = ['goalProtKg', 'goalCHOKg', 'goalLipKg', 'peso', 'goalTotal'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateMacroGoals);
    });

    // Toggle Modes
    const btnGkg = document.getElementById('btnModeGkg');
    const btnPct = document.getElementById('btnModePct');
    if (btnGkg && btnPct) {
        btnGkg.onclick = () => {
            macroGoalMode = 'gkg';
            btnGkg.classList.add('active');
            btnPct.classList.remove('active');
            document.getElementById('lblProtGoal').innerText = "Prot (g/kg)";
            document.getElementById('lblCHOGoal').innerText = "CHO (g/kg)";
            document.getElementById('lblLipGoal').innerText = "Líp (g/kg)";

            // Update placeholders for g/kg
            document.getElementById('goalProtKg').placeholder = "Ej. 1.5";
            document.getElementById('goalCHOKg').placeholder = "Ej. 5.0";
            document.getElementById('goalLipKg').placeholder = "Ej. 2.0";

            document.getElementById('macroPctProt').style.display = 'block';
            document.getElementById('macroPctCHO').style.display = 'block';
            document.getElementById('macroPctLip').style.display = 'block';
            document.getElementById('pctTotalWarning').style.display = 'flex';

            updateMacroGoals();
        };
        btnPct.onclick = () => {
            macroGoalMode = 'pct';
            btnPct.classList.add('active');
            btnGkg.classList.remove('active');
            document.getElementById('lblProtGoal').innerText = "Prot (%)";
            document.getElementById('lblCHOGoal').innerText = "CHO (%)";
            document.getElementById('lblLipGoal').innerText = "Líp (%)";

            // Update placeholders for pct
            document.getElementById('goalProtKg').placeholder = "Ej. 15%";
            document.getElementById('goalCHOKg').placeholder = "Ej. 55%";
            document.getElementById('goalLipKg').placeholder = "Ej. 30%";

            document.getElementById('macroPctProt').style.display = 'block';
            document.getElementById('macroPctCHO').style.display = 'block';
            document.getElementById('macroPctLip').style.display = 'block';
            document.getElementById('pctTotalWarning').style.display = 'flex';

            updateMacroGoals();
        };
    }

    // GET Selector Logic
    // GET Selector Logic: Keep only Manual and Evol.
    const getSelector = document.getElementById('getSelector');
    // The getSelector is now a hidden field or simplified, but we keep the logic for factorial
    const updateFinalMeta = () => {
        const boxVal = document.getElementById('goalKcalBox')?.value || 0;
        const p = AppState.patient || {};
        const inputPeso = document.getElementById('peso');
        const peso = parseFloat(inputPeso ? inputPeso.value : 0) || p.peso_calculo || p.peso || 0;

        const goalTotalEl = document.getElementById('goalTotal');
        if (goalTotalEl && boxVal > 0) {
            goalTotalEl.value = Math.round(parseFloat(boxVal) * peso);
            goalTotalEl.dispatchEvent(new Event('input'));
        }
    };

    document.getElementById('goalKcalBox')?.addEventListener('input', updateFinalMeta);
    document.getElementById('peso')?.addEventListener('input', () => {
        updateFinalMeta();
        if (typeof calcTMB_OMS === 'function') calcTMB_OMS();
        if (typeof calcFactorial === 'function') calcFactorial();
    });
    document.getElementById('peso')?.addEventListener('change', () => {
        const pesoVal = parseFloat(document.getElementById('peso')?.value) || 0;
        if (pesoVal > 0) {
            logWeightToHistory(pesoVal);
        }
    });

    // NEW V4.39: Macro Presets
    window.applyMacroPreset = (type, value) => {
        if (type === 'prot') {
            const input = document.getElementById('goalProtKg');
            if (input) {
                input.value = value;
                input.dispatchEvent(new Event('input'));
                showToast(`🎯 Proteína fijada en ${value} g/kg`);
            }
        }
    };
}

function updateMacroGoals() {
    const p = AppState.patient || {};
    // Robust weight detection
    const inputPeso = document.getElementById('peso');
    const peso = parseFloat(inputPeso ? inputPeso.value : 0) || p.peso_calculo || p.peso || 0;

    const getTotal = parseFloat(document.getElementById('goalTotal')?.value) || 0;

    const valP = parseFloat(document.getElementById('goalProtKg')?.value) || 0;
    const valC = parseFloat(document.getElementById('goalCHOKg')?.value) || 0;
    const valL = parseFloat(document.getElementById('goalLipKg')?.value) || 0;

    let gProt = 0, gCHO = 0, gLip = 0;
    let pctP = 0, pctC = 0, pctL = 0;

    // Determine effectiveGoal based on selected adequacyMode (META vs GET)
    const adeqMode = AppState.adequacyMode || 'goal';
    const theoreticalGET = p.tmt || p.tmt_calculated || parseFloat(document.getElementById('valGET')?.innerText) || 2000;
    const effectiveGoal = (adeqMode === 'get') ? theoreticalGET : (getTotal || theoreticalGET);

    if (macroGoalMode === 'gkg') {
        gProt = valP * peso;
        gCHO = valC * peso;
        gLip = valL * peso;
        if (effectiveGoal > 0) {
            pctP = ((gProt * 4) / effectiveGoal) * 100;
            pctC = ((gCHO * 4) / effectiveGoal) * 100;
            pctL = ((gLip * 9) / effectiveGoal) * 100;
        }
    } else {
        // Mode: PCT
        pctP = valP;
        pctC = valC;
        pctL = valL;
        if (effectiveGoal > 0) {
            gProt = (effectiveGoal * (pctP / 100)) / 4;
            gCHO = (effectiveGoal * (pctC / 100)) / 4;
            gLip = (effectiveGoal * (pctL / 100)) / 9;
        }
    }

    const gkgP = peso > 0 ? (gProt / peso) : 0;
    const gkgC = peso > 0 ? (gCHO / peso) : 0;
    const gkgL = peso > 0 ? (gLip / peso) : 0;

    const elP = document.getElementById('goalProt');
    if (elP) { elP.dataset.val = gProt; elP.innerText = gProt.toFixed(1) + " g/día"; }
    const elC = document.getElementById('goalCHO');
    if (elC) { elC.dataset.val = gCHO; elC.innerText = gCHO.toFixed(1) + " g/día"; }
    const elL = document.getElementById('goalLip');
    if (elL) { elL.dataset.val = gLip; elL.innerText = gLip.toFixed(1) + " g/día"; }

    // Update internal sub-labels
    if (macroGoalMode === 'pct') {
        if (document.getElementById('macroPctProt')) document.getElementById('macroPctProt').innerText = `(${gkgP.toFixed(2)} g/kg)`;
        if (document.getElementById('macroPctCHO')) document.getElementById('macroPctCHO').innerText = `(${gkgC.toFixed(2)} g/kg)`;
        if (document.getElementById('macroPctLip')) document.getElementById('macroPctLip').innerText = `(${gkgL.toFixed(2)} g/kg)`;
    } else {
        // En modo g/kg: mostrar el aporte porcentual de cada macro respecto al GET
        if (document.getElementById('macroPctProt')) document.getElementById('macroPctProt').innerText = `(${pctP.toFixed(1)}%)`;
        if (document.getElementById('macroPctCHO')) document.getElementById('macroPctCHO').innerText = `(${pctC.toFixed(1)}%)`;
        if (document.getElementById('macroPctLip')) document.getElementById('macroPctLip').innerText = `(${pctL.toFixed(1)}%)`;
    }

    const kcalProt = gProt * 4;
    const kcalCHO = gCHO * 4;
    const kcalLip = gLip * 9;
    const totalKcal = kcalProt + kcalCHO + kcalLip;

    const elMacroKcal = document.getElementById('goalMacroKcal');
    if (elMacroKcal) elMacroKcal.innerText = Math.round(totalKcal);

    // --- TOTAL % INDICATOR ---
    const currentPctSum = pctP + pctC + pctL;
    const totalPctOfEnergia = (effectiveGoal > 0) ? (totalKcal / effectiveGoal) * 100 : currentPctSum;
    const pctDisplay = (macroGoalMode === 'pct') ? currentPctSum : totalPctOfEnergia;

    const warnBox = document.getElementById('pctTotalWarning');
    const warnCheck = document.getElementById('pctTotalCheck');

    if (warnBox && warnCheck && (valP > 0 || valC > 0 || valL > 0)) {
        warnCheck.innerText = pctDisplay.toFixed(1) + '%';

        let color;
        if (pctDisplay >= 98 && pctDisplay <= 102) color = '#27ae60';
        else if (pctDisplay < 98) color = '#f39c12';
        else color = '#e74c3c';

        warnBox.style.background = color + '22';
        warnBox.style.borderColor = color + '66';
        warnCheck.style.color = color;
        warnBox.style.display = 'flex';
    } else if (warnBox) {
        warnBox.style.display = 'none';
    }

    if (goalChartInstance) {
        let chartData = [kcalProt, kcalCHO, kcalLip];
        // Proporciones para el gráfico si las kcal absolutas son 0
        if (totalKcal === 0 && (pctP || pctC || pctL)) {
            chartData = [pctP * 4, pctC * 4, pctL * 9];
        }
        goalChartInstance.data.datasets[0].data = chartData;
        goalChartInstance.update();
    }

    // Auto-update adequacy and Traslape
    if (window.updateTraslapeConfig) {
        window.updateTraslapeConfig();
    } else {
        runSimulation();
    }
}



// --- WAIST EVALUATION ENGINE (CC) ---
window.evaluateWaist = (makeBadgeFn = null) => {
    const p = AppState.patient;
    const cc = parseFloat(document.getElementById('ccintura')?.value) || 0;
    const resEl = document.getElementById('valWaistClass');

    if (cc <= 0) {
        if (resEl) resEl.innerText = "";
        return "";
    }

    let status = "Normal";
    let color = "#27ae60";

    if (p.type === 'pediatric' || p.type === 'neonate') {
        const y = Math.floor(p.edad);
        if (y >= 5 && y <= 19 && window.WAIST_PERCENTILES) {
            const table = window.WAIST_PERCENTILES[p.sexo];
            const ref = table[y] || (y > 18 ? table[18] : null);
            if (ref) {
                if (cc > ref.p90) {
                    status = "Obesidad Abdominal";
                    color = "#e74c3c";
                } else if (cc > ref.p75) {
                    status = "Riesgo Obesidad Abdominal";
                    color = "#f39c12";
                }
            }
        }
    } else {
        // Adult Logic (MINSAL + Umbrales de Depleción Severa)
        if (p.sexo === 'm') {
            if (cc >= 102) { status = "Obesidad Abdominal"; color = "#c0392b"; }
            else if (cc >= 94) { status = "Riesgo Cardiovascular"; color = "#f39c12"; }
            else if (cc < 65) { status = "Depleción Severa / Cintura Disminuida"; color = "#e67e22"; }
        } else {
            if (cc >= 88) { status = "Obesidad Abdominal"; color = "#c0392b"; }
            else if (cc >= 80) { status = "Riesgo Cardiovascular"; color = "#f39c12"; }
            else if (cc < 58) { status = "Depleción Severa / Cintura Disminuida"; color = "#e67e22"; }
        }
    }

    if (resEl) {
        resEl.innerText = status;
        resEl.style.color = color;
    }

    if (makeBadgeFn) {
        return makeBadgeFn('Cintura (CC)', 0, status, color);
    }
    return "";
};


// --- NEW V4.60: Advanced NPT Dashboard Logic ---
window.applyNPTTemplate = () => {
    const type = document.getElementById('nptTemplate').value;
    const vol = parseFloat(document.getElementById('advNptVol').value) || 1000;
    const templates = {
        'smof_central': { dex: 127, aa: 50, lip: 38, na: 40, k: 30 },
        'smof_peri': { dex: 71, aa: 32, lip: 28, na: 24, k: 18 }
    };
    if (templates[type]) {
        const factor = vol / 1000;
        document.getElementById('advNptDex').value = Math.round(templates[type].dex * factor);
        document.getElementById('advNptAA').value = Math.round(templates[type].aa * factor);
        document.getElementById('advNptLip').value = Math.round(templates[type].lip * factor);
        document.getElementById('advNptNa').value = Math.round(templates[type].na * factor);
        document.getElementById('advNptK').value = Math.round(templates[type].k * factor);
    }
    window.updateAdvancedNPT();
};

window.updateAdvancedNPT = (trigger) => {
    const vol = parseFloat(document.getElementById('advNptVol')?.value) || 0;
    const dex = parseFloat(document.getElementById('advNptDex')?.value) || 0;
    const aa = parseFloat(document.getElementById('advNptAA')?.value) || 0;
    const lip = parseFloat(document.getElementById('advNptLip')?.value) || 0;
    const weight = AppState.patient?.peso_calculo || AppState.patient?.peso || 0;
    if (document.getElementById('advNptWeight')) document.getElementById('advNptWeight').value = weight;
    const kcalTotalNP = (dex * 3.4) + (lip * 9) + (aa * 4);
    let gir = 0; if (weight > 0) gir = (dex * 1000) / (weight * 1440);
    let osm = 0;
    if (vol > 0) {
        const na = parseFloat(document.getElementById('advNptNa')?.value) || 0;
        const k = parseFloat(document.getElementById('advNptK')?.value) || 0;
        osm = ((dex/vol)*5000) + ((aa/vol)*10000) + ((na/vol)*2000) + ((k/vol)*2000);
    }
    if (document.getElementById('advNptOsm')) document.getElementById('advNptOsm').innerText = Math.round(osm);
    if (document.getElementById('advNptGIR')) document.getElementById('advNptGIR').innerText = gir.toFixed(1);
    const statusEl = document.getElementById('advNptStatus');
    if (statusEl) {
        statusEl.innerText = osm > 800 ? "Central" : "Periférica";
        statusEl.style.background = osm > 800 ? "#e74c3c" : "#27ae60";
    }
    const entId = document.getElementById('advEnteralProduct').value;
    const adeqMode = AppState.adequacyMode || 'goal';
    const theoreticalGET = AppState.patient?.tmt || AppState.patient?.tmt_calculated || parseFloat(document.getElementById('valGET')?.innerText) || 2000;
    const reqKcal = (adeqMode === 'get') ? theoreticalGET : (parseFloat(document.getElementById('goalTotal')?.value) || theoreticalGET);
    let entVolInput = document.getElementById('advEnteralVol');
    let entPctInput = document.getElementById('advEnteralPct');
    let entVol = parseFloat(entVolInput?.value) || 0;
    let entPct = parseFloat(entPctInput?.value) || 0;
    if (entId !== 'none' && reqKcal > 0) {
        const formula = AppState.formulas.find(f => f.id === entId);
        if (formula) {
            const dens = formula.k / (formula.volBase || 100);
            if (trigger === 'pct') {
                entVol = (reqKcal * (entPct / 100)) / dens;
                if (entVolInput) entVolInput.value = Math.round(entVol);
            } else if (trigger === 'vol' || trigger === 'product') {
                entPct = ((entVol * dens) / reqKcal) * 100;
                if (entPctInput) entPctInput.value = Math.round(entPct);
            }
        }
    }
    let entKcal = 0, entProt = 0;
    if (entId !== 'none' && entVol > 0) {
        const f = AppState.formulas.find(f => f.id === entId);
        if (f) {
            const base = f.volBase || 100;
            entKcal = (entVol / base) * f.k;
            entProt = (entVol / base) * f.p;
        }
    }
    const totalKcal = kcalTotalNP + entKcal;
    const totalProt = aa + entProt;
    const totalVol = vol + entVol;
    const reqProt = parseFloat(document.getElementById('goalProt')?.dataset.val) || 0;
    const reqVol = parseFloat(document.getElementById('goalFluid')?.value) || 0;
    const adeqKcal = reqKcal > 0 ? (totalKcal / reqKcal) * 100 : 0;
    const adeqProt = reqProt > 0 ? (totalProt / reqProt) * 100 : 0;
    const adeqVol = reqVol > 0 ? (totalVol / reqVol) * 100 : 0;
    if (document.getElementById('totalAdeqKcal')) document.getElementById('totalAdeqKcal').innerText = Math.round(adeqKcal) + '%';
    if (document.getElementById('totalAdeqProt')) document.getElementById('totalAdeqProt').innerText = Math.round(adeqProt) + '%';
    if (document.getElementById('totalAdeqHyd')) document.getElementById('totalAdeqHyd').innerText = Math.round(adeqVol) + '%';
    if (document.getElementById('totalKcalVal')) document.getElementById('totalKcalVal').innerText = Math.round(totalKcal) + " / " + Math.round(reqKcal) + " kcal";
    if (document.getElementById('totalProtVal')) document.getElementById('totalProtVal').innerText = totalProt.toFixed(1) + " / " + reqProt.toFixed(1) + " g";
    if (document.getElementById('totalHydVal')) document.getElementById('totalHydVal').innerText = Math.round(totalVol) + " / " + Math.round(reqVol) + " ml";
    const bar = document.getElementById('totalAdeqBar');
    if (bar) bar.style.width = Math.min(adeqKcal, 100) + '%';
    const statusLabel = document.getElementById('traslapeStatusLabel');
    if (statusLabel) {
        if (adeqKcal > 95) statusLabel.innerText = "Meta Alcanzada";
        else if (entVol > 0) statusLabel.innerText = "En Traslape Activo (" + Math.round(entPct) + "% NE)";
        else statusLabel.innerText = "Fase Parenteral (100% NP)";
    }
};

window.populateEnteralList = () => {
    const select = document.getElementById('advEnteralProduct');
    if (!select) return;
    let html = '<option value="none">-- Sin Enteral --</option>';
    
    // Oral supplement IDs that should be excluded from Advanced Enteral transition dropdown
    const excludedOralIds = ["alprem_liquido", "alprem", "e1", "e2", "e3", "e4", "g1", "g2", "g3", "g4"];
    
    AppState.formulas.forEach(f => {
        if (f.cat === "Fórmulas RTH" || (f.cat === "Leches HRA" && !excludedOralIds.includes(f.id))) {
            html += '<option value="' + f.id + '">' + f.name + '</option>';
        }
    });
    select.innerHTML = html;
};

const oldInit = window.initTabNavigation;
window.initTabNavigation = function() {
    if (oldInit) oldInit();
    document.querySelectorAll('.app-tabs .tab-btn').forEach(t => {
        t.addEventListener('click', () => {
            if (t.dataset.view === 'nutri-ia') {
                window.populateEnteralList();
                window.updateAdvancedNPT();
            }
        });
    });
};

// --- NEW V4.50: Edema & Ascites Logic ---
window.toggleEdemaPanel = () => {
    const p = document.getElementById('edemaPanel');
    if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
};

window.updateDryWeight = () => {
    const rawPeso = parseFloat(document.getElementById('peso')?.value) || 0;
    const edemaKg = parseFloat(document.getElementById('edemaGrade')?.value) || 0;
    const ascitisKg = parseFloat(document.getElementById('ascitesGrade')?.value) || 0;
    
    const dryWeight = Math.max(0, rawPeso - (edemaKg + ascitisKg));
    const out = document.getElementById('dryWeightOut');
    if (out) out.innerText = dryWeight.toFixed(1) + " kg";
    
    // Sincronizar con AppState si el modo es 'dry'
    const mode = document.getElementById('pesoCalculoSelect')?.value;
    if (mode === 'dry') {
        calculateRequirements();
    }
};

// --- INTERACTIVE ANAMNESIS & STRONGKIDS CLINICAL LOGIC ---
window.setToggleState = (elementId, value) => {
    const group = document.querySelector(`.toggle-btn-group[data-id="${elementId}"]`);
    if (!group) return;
    
    const btns = group.querySelectorAll('.btn-toggle');
    btns.forEach(btn => {
        btn.style.background = '#f7fafc';
        btn.style.color = '#a0aec0';
        btn.style.borderColor = '#e2e8f0';
        btn.classList.remove('active');
        
        const isSiBtn = btn.innerText.trim() === 'SÍ' || btn.innerText.trim() === 'SI';
        if ((value === 'Sí' && isSiBtn) || (value === 'No' && !isSiBtn)) {
            btn.classList.add('active');
            if (value === 'Sí') {
                btn.style.background = '#d1fae5';
                btn.style.color = '#1e8449';
                btn.style.borderColor = '#6ee7b7';
            } else {
                btn.style.background = '#fee2e2';
                btn.style.color = '#c0392b';
                btn.style.borderColor = '#fca5a5';
            }
        }
    });

    if (!AppState.patient.anamnesis) AppState.patient.anamnesis = {};
    AppState.patient.anamnesis[elementId] = value;
};

window.setSkState = (qId, value, ptsYes) => {
    const group = document.querySelector(`.sk-btn-group[data-q="${qId}"]`);
    if (!group) return;

    const btns = group.querySelectorAll('.btn-toggle');
    btns.forEach(btn => {
        btn.style.background = '#f7fafc';
        btn.style.color = '#a0aec0';
        btn.style.borderColor = '#e2e8f0';
        btn.classList.remove('active');
        
        const isSiBtn = btn.innerText.trim() === 'SÍ' || btn.innerText.trim() === 'SI';
        if ((value === 'Sí' && isSiBtn) || (value === 'No' && !isSiBtn)) {
            btn.classList.add('active');
            if (value === 'Sí') {
                btn.style.background = '#d1fae5';
                btn.style.color = '#1e8449';
                btn.style.borderColor = '#6ee7b7';
            } else {
                btn.style.background = '#fee2e2';
                btn.style.color = '#c0392b';
                btn.style.borderColor = '#fca5a5';
            }
        }
    });

    const scoreLabel = document.getElementById(`skScoreQ${qId.substring(1).toUpperCase()}`);
    if (scoreLabel) {
        scoreLabel.innerText = value === 'Sí' ? `+${ptsYes} pts` : '0 pts';
        scoreLabel.style.color = value === 'Sí' ? '#e74c3c' : '#95a5a6';
    }

    window.calculateStrongKids();
};

window.calculateStrongKids = () => {
    let total = 0;
    
    const q1Active = document.querySelector('.sk-btn-group[data-q="q1"] .btn-toggle.si.active');
    const q2Active = document.querySelector('.sk-btn-group[data-q="q2"] .btn-toggle.si.active');
    const q3Active = document.querySelector('.sk-btn-group[data-q="q3"] .btn-toggle.si.active');
    const q4Active = document.querySelector('.sk-btn-group[data-q="q4"] .btn-toggle.si.active');

    if (q1Active) total += 2;
    if (q2Active) total += 1;
    if (q3Active) total += 1;
    if (q4Active) total += 1;

    const totalBadge = document.getElementById('strongKidsTotalScore');
    if (totalBadge) totalBadge.innerText = total + ' pts';

    let classif = 'Riesgo bajo';
    let color = '#27ae60';
    let bg = 'rgba(39, 174, 96, 0.05)';
    let border = 'rgba(39, 174, 96, 0.2)';
    let recs = `• No es necesaria una intervención nutricional.\n• Controlar el peso regularmente (según la política hospitalaria).\n• Evaluar el riesgo nutricional semanalmente.`;

    if (total >= 4) {
        classif = 'Riesgo alto';
        color = '#c0392b';
        bg = 'rgba(192, 57, 43, 0.05)';
        border = 'rgba(192, 57, 43, 0.2)';
        recs = `• Consulte al médico y al dietista para obtener un diagnóstico completo y asesoramiento nutricional individual y seguimiento.\n• Controle el peso dos veces por semana y evalúe el estado nutricional.\n• Evaluar el riesgo nutricional semanalmente.`;
    } else if (total >= 1) {
        classif = 'Riesgo medio';
        color = '#d35400';
        bg = 'rgba(211, 84, 0, 0.05)';
        border = 'rgba(211, 84, 0, 0.2)';
        recs = `• Considere la intervención nutricional.\n• Controlar el peso dos veces por semana.\n• Evaluar el riesgo nutricional semanalmente.`;
    }

    const classifLabel = document.getElementById('strongKidsClassif');
    const recsArea = document.getElementById('strongKidsRecs');
    const panelBox = document.getElementById('strongKidsResultPanel');

    if (classifLabel) {
        classifLabel.innerText = classif.toUpperCase();
        classifLabel.style.color = color;
    }
    if (recsArea) {
        recsArea.innerText = recs;
    }
    if (panelBox) {
        panelBox.style.background = bg;
        panelBox.style.borderColor = border;
        panelBox.style.borderWidth = '1px';
    }

    if (!AppState.patient.strongkids) AppState.patient.strongkids = {};
    AppState.patient.strongkids.score = total;
    AppState.patient.strongkids.classification = classif;
    const scrgText = `${total} pts`;
    if (AppState.patient.id) {
        try {
            let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
            const pIdx = localCache.findIndex(p => p.id === AppState.patient.id);
            if (pIdx >= 0) {
                localCache[pIdx].metadata = localCache[pIdx].metadata || {};
                localCache[pIdx].metadata.nrs_score = scrgText;
                localCache[pIdx].metadata.screening_score = scrgText;
                localCache[pIdx].metadata.strongkids = AppState.patient.strongkids;
                localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
            }
        } catch(e) {}
        const scrgCell = document.getElementById(`table_scrg_${AppState.patient.id}`);
        if (scrgCell) {
            const bgStyle = total >= 4 ? 'background:#fee2e2; color:#c0392b; font-weight:800; border-radius:4px; padding:2px 6px;' : (total >= 1 ? 'background:#fef3c7; color:#92400e; font-weight:700; border-radius:4px; padding:2px 6px;' : 'background:#dcfce7; color:#166534; font-weight:700; border-radius:4px; padding:2px 6px;');
            scrgCell.innerHTML = `<span style="${bgStyle}">${scrgText}</span>`;
        }
    }
};

window.setNrsInitialState = (qId, value) => {
    if (!AppState.patient.nrs2002) AppState.patient.nrs2002 = {};
    if (!AppState.patient.nrs2002.initialAnswers) AppState.patient.nrs2002.initialAnswers = {};
    AppState.patient.nrs2002.initialAnswers[qId] = value;

    const group = document.querySelector(`.nrs-init-btn-group[data-q="${qId}"]`);
    if (!group) return;

    const btns = group.querySelectorAll('.btn-toggle');
    btns.forEach(btn => {
        btn.style.background = '#f7fafc';
        btn.style.color = '#a0aec0';
        btn.style.borderColor = '#e2e8f0';
        btn.classList.remove('active');
        
        const isSiBtn = btn.innerText.trim() === 'SÍ' || btn.innerText.trim() === 'SI';
        if ((value === 'Sí' && isSiBtn) || (value === 'No' && !isSiBtn)) {
            btn.classList.add('active');
            if (value === 'Sí') {
                btn.style.background = '#fee2e2';
                btn.style.color = '#c0392b';
                btn.style.borderColor = '#fca5a5';
            } else {
                btn.style.background = '#d1fae5';
                btn.style.color = '#1e8449';
                btn.style.borderColor = '#6ee7b7';
            }
        }
    });

    window.calculateNRS2002();
};

window.calculateNRS2002 = () => {
    const finalSection = document.getElementById('nrs2002FinalSection');
    const statusSelect = document.getElementById('nrsNutritionalStatus');
    const severitySelect = document.getElementById('nrsDiseaseSeverity');
    
    if (!statusSelect || !severitySelect) return;
    
    if (!AppState.patient.nrs2002) AppState.patient.nrs2002 = {};
    if (!AppState.patient.nrs2002.initialAnswers) {
        AppState.patient.nrs2002.initialAnswers = {
            nrsQ1: 'No',
            nrsQ2: 'No',
            nrsQ3: 'No',
            nrsQ4: 'No'
        };
    }

    const initAnswers = AppState.patient.nrs2002.initialAnswers;
    const hasAnyYes = Object.values(initAnswers).some(val => val === 'Sí');

    const totalBadge = document.getElementById('nrsTotalScore');
    const classifLabel = document.getElementById('nrsClassif');
    const recsArea = document.getElementById('nrsRecs');
    const panelBox = document.getElementById('nrsResultPanel');

    // Elementos de UI de resultados
    let total = 0;
    let classif = 'Sin riesgo';
    let color = '#1abc9c';
    let bg = 'rgba(26, 188, 156, 0.05)';
    let border = 'rgba(26, 188, 156, 0.2)';
    let recs = '';

    if (!hasAnyYes) {
        // ESCENARIO A: Todo NO en Screening Inicial
        if (finalSection) finalSection.style.display = 'none';

        recs = `• El paciente se encuentra sin riesgo en el screening inicial.\n• Reevaluar semanalmente durante la hospitalización.\n• En caso de que el paciente vaya a ser sometido a una cirugía mayor, considerar la posibilidad de soporte nutricional perioperatorio.`;
        
        if (totalBadge) totalBadge.innerText = '0 pts';
        if (classifLabel) {
            classifLabel.innerText = 'SIN RIESGO';
            classifLabel.style.color = color;
            classifLabel.style.borderColor = border;
        }
        if (recsArea) recsArea.innerText = recs;
        if (panelBox) {
            panelBox.style.background = bg;
            panelBox.style.borderColor = border;
        }

        AppState.patient.nrs2002.score = 0;
        AppState.patient.nrs2002.classification = 'Sin riesgo nutricional (Filtro Inicial Negativo)';
        AppState.patient.nrs2002.statusScore = 0;
        AppState.patient.nrs2002.severityScore = 0;
        AppState.patient.nrs2002.ageScore = 0;
        if (AppState.patient.id) {
            try {
                let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
                const pIdx = localCache.findIndex(p => p.id === AppState.patient.id);
                if (pIdx >= 0) {
                    localCache[pIdx].metadata = localCache[pIdx].metadata || {};
                    localCache[pIdx].metadata.nrs_score = '0 pts';
                    localCache[pIdx].metadata.screening_score = '0 pts';
                    localCache[pIdx].metadata.nrs2002 = AppState.patient.nrs2002;
                    localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
                }
            } catch(e) {}
            const scrgCell = document.getElementById(`table_scrg_${AppState.patient.id}`);
            if (scrgCell) {
                scrgCell.innerHTML = `<span style="background:#dcfce7; color:#166534; font-weight:700; border-radius:4px; padding:2px 6px;">0 pts</span>`;
            }
        }
    } else {
        // ESCENARIO B: Al menos un SÍ en Screening Inicial
        if (finalSection) finalSection.style.display = 'block';

        const statusVal = parseInt(statusSelect.value) || 0;
        const severityVal = parseInt(severitySelect.value) || 0;
        
        // Obtener edad del paciente desde el input de edad
        const age = parseFloat(document.getElementById('edad')?.value) || 0;
        
        // Si edad >= 70 años, suma +1 punto automáticamente
        const ageScore = age >= 70 ? 1 : 0;
        
        // Actualizar badge de bonificación por edad
        const nrsAgeBonus = document.getElementById('nrsAgeBonus');
        if (nrsAgeBonus) {
            if (ageScore > 0) {
                nrsAgeBonus.innerText = `+1 pt`;
                nrsAgeBonus.style.background = '#fee2e2';
                nrsAgeBonus.style.color = '#c0392b';
            } else {
                nrsAgeBonus.innerText = `+0 pts`;
                nrsAgeBonus.style.background = '#f1f5f9';
                nrsAgeBonus.style.color = '#64748b';
            }
        }
        
        total = statusVal + severityVal + ageScore;
        
        if (total >= 3) {
            classif = 'Con riesgo';
            color = '#c0392b';
            bg = 'rgba(192, 57, 43, 0.05)';
            border = 'rgba(192, 57, 43, 0.2)';
            recs = `• El paciente presenta RIESGO NUTRICIONAL.\n• Iniciar plan de soporte nutricional formal según protocolo institucional.\n• Monitorear estrechamente la ingesta alimentaria y el peso.\n• Reevaluar periódicamente.`;
        } else {
            classif = 'Sin riesgo';
            color = '#1abc9c';
            bg = 'rgba(26, 188, 156, 0.05)';
            border = 'rgba(26, 188, 156, 0.2)';
            recs = `• El paciente no presenta riesgo nutricional en la evaluación final.\n• Reevaluar el tamizaje semanalmente durante la hospitalización.\n• Si el paciente está programado para una cirugía mayor, considerar plan preventivo.`;
        }
        
        if (totalBadge) totalBadge.innerText = total + ' pts';
        if (classifLabel) {
            classifLabel.innerText = classif.toUpperCase() + ' NUTRICIONAL';
            classifLabel.style.color = color;
            classifLabel.style.borderColor = border;
        }
        if (recsArea) recsArea.innerText = recs;
        if (panelBox) {
            panelBox.style.background = bg;
            panelBox.style.borderColor = border;
        }
        
        AppState.patient.nrs2002.score = total;
        AppState.patient.nrs2002.classification = classif === 'Con riesgo' ? 'Con riesgo nutricional' : 'Sin riesgo nutricional';
        AppState.patient.nrs2002.statusScore = statusVal;
        AppState.patient.nrs2002.severityScore = severityVal;
        AppState.patient.nrs2002.ageScore = ageScore;
        const scrgText = `${total} pts`;
        if (AppState.patient.id) {
            try {
                let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
                const pIdx = localCache.findIndex(p => p.id === AppState.patient.id);
                if (pIdx >= 0) {
                    localCache[pIdx].metadata = localCache[pIdx].metadata || {};
                    localCache[pIdx].metadata.nrs_score = scrgText;
                    localCache[pIdx].metadata.screening_score = scrgText;
                    localCache[pIdx].metadata.nrs2002 = AppState.patient.nrs2002;
                    localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
                }
            } catch(e) {}
            const scrgCell = document.getElementById(`table_scrg_${AppState.patient.id}`);
            if (scrgCell) {
                const bgStyle = total >= 3 ? 'background:#fee2e2; color:#c0392b; font-weight:800; border-radius:4px; padding:2px 6px;' : 'background:#dcfce7; color:#166534; font-weight:700; border-radius:4px; padding:2px 6px;';
                scrgCell.innerHTML = `<span style="${bgStyle}">${scrgText}</span>`;
            }
        }
    }
};

window.initAnamnesisToggles = () => {
    if (!AppState.patient) AppState.patient = {};
    if (!AppState.patient.anamnesis) {
        AppState.patient.anamnesis = {
            sintomaNauseas: 'No',
            sintomaVomitos: 'No',
            sintomaReflujo: 'No',
            sintomaDeposiciones: 'No',
            sintomaDistension: 'No',
            sintomaGases: 'No',
            anamnesisDentadura: 'Sí',
            anamnesisAlergias: 'No',
            anamnesisDeglucion: 'No',
            anamnesisApetito: 'Sí'
        };
    }
    if (!AppState.patient.strongkids) {
        AppState.patient.strongkids = {
            score: 0,
            classification: 'Riesgo bajo'
        };
    }
    if (!AppState.patient.nrs2002) {
        AppState.patient.nrs2002 = {
            score: 0,
            classification: 'Sin riesgo nutricional (Filtro Inicial Negativo)',
            statusScore: 0,
            severityScore: 0,
            ageScore: 0,
            initialAnswers: {
                nrsQ1: 'No',
                nrsQ2: 'No',
                nrsQ3: 'No',
                nrsQ4: 'No'
            }
        };
    }

    Object.entries(AppState.patient.anamnesis).forEach(([id, val]) => {
        window.setToggleState(id, val);
    });

    window.setSkState('q1', 'No', 2);
    window.setSkState('q2', 'No', 1);
    window.setSkState('q3', 'No', 1);
    window.setSkState('q4', 'No', 1);
    
    window.setNrsInitialState('nrsQ1', 'No');
    window.setNrsInitialState('nrsQ2', 'No');
    window.setNrsInitialState('nrsQ3', 'No');
    window.setNrsInitialState('nrsQ4', 'No');
};






















// --- CURVAS DE CRECIMIENTO DINÁMICAS ---
window.showCurve = function(type) {
    const area = document.getElementById('curveDisplayArea');
    const placeholder = document.getElementById('curveImagePlaceholder');
    const img = document.getElementById('curveImg');
    const dot = document.getElementById('curveDot');
    const dot2 = document.getElementById('curveDot2');
    
    if(!area || !img || !placeholder || !dot) return;
    
    placeholder.style.display = 'none';
    img.style.display = 'block';
    dot.style.display = 'none'; // hide until plotted
    if (dot2) dot2.style.display = 'none'; // default hide dot2
    
    // Data extraction
    const peso = parseFloat(document.getElementById('peso').value) || 0;
    let talla = parseFloat(document.getElementById('estatura').value) || 0; // en cm (could be entered in meters)
    if (talla > 0 && talla <= 3) {
        talla = talla * 100;
    }
    const pc = parseFloat(document.getElementById('pcefalico').value) || 0;
    const sexo = document.getElementById('sexo').value || 'f';
    
    // Age calculation
    let edadMeses = parseFloat(document.getElementById('edad').value) || 0; 
    const fn = document.getElementById('fechaNacimiento').value;
    let agePostnatalDays = 0;
    
    const birth = parseSpanishDate(fn);
    if (birth) {
        const now = new Date();
        let months = (now.getFullYear() - birth.getFullYear()) * 12;
        months -= birth.getMonth();
        months += now.getMonth();
        if (now.getDate() < birth.getDate()) months--;
        if (months >= 0) edadMeses = months;
        
        agePostnatalDays = Math.floor(Math.abs(now - birth) / (1000 * 60 * 60 * 24));
    }

    // Neonatal Gestational Age corregida for curve X-axis
    const semNac = parseInt(document.getElementById('egSemanas')?.value) || 0;
    const diasNac = parseInt(document.getElementById('egDias')?.value) || 0;
    let egNeonatal = semNac + (diasNac / 7);
    if (agePostnatalDays > 0) {
        egNeonatal = semNac + ((diasNac + agePostnatalDays) / 7);
    }
    if (egNeonatal < 24) egNeonatal = 24;
    if (egNeonatal > 42) egNeonatal = 42;

    // IMC Calculation
    let imc = 0;
    if (talla > 0 && peso > 0) {
        imc = peso / Math.pow(talla / 100, 2);
    }

    // --- MAPA DE CALIBRACIÓN AVANZADA ---
    // Estructura: curveMeta[type][sexo] es un array de rangos
    const curveMeta = {
        'pe': {
            'f': [
                { minAge: 0, maxAge: 24, url: 'assets/curvas/pe_f_0_2.png', xValue: edadMeses, yValue: peso, xMin: 0, xMax: 24, yMin: 2, yMax: 17, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Peso (kg)' },
                { minAge: 24, maxAge: 60, url: 'assets/curvas/pe_f_2_5.png', xValue: edadMeses, yValue: peso, xMin: 24, xMax: 60, yMin: 8, yMax: 25, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Peso (kg)' }
            ],
            'm': [
                { minAge: 0, maxAge: 24, url: 'assets/curvas/pe_m_0_2.png', xValue: edadMeses, yValue: peso, xMin: 0, xMax: 24, yMin: 2, yMax: 17, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Peso (kg)' },
                { minAge: 24, maxAge: 60, url: 'assets/curvas/pe_m_2_5.png', xValue: edadMeses, yValue: peso, xMin: 24, xMax: 60, yMin: 8, yMax: 25, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Peso (kg)' }
            ]
        },
        'te': {
            'f': [
                { minAge: 0, maxAge: 24, url: 'assets/curvas/te_f_0_2.png', xValue: edadMeses, yValue: talla, xMin: 0, xMax: 24, yMin: 45, yMax: 95, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Talla (cm)' },
                { minAge: 24, maxAge: 60, url: 'assets/curvas/te_f_2_5.png', xValue: edadMeses, yValue: talla, xMin: 24, xMax: 60, yMin: 75, yMax: 120, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Talla (cm)' },
                { minAge: 60, maxAge: 228, url: 'assets/curvas/te_f_5_19.png', xValue: edadMeses, yValue: talla, xMin: 60, xMax: 228, yMin: 100, yMax: 180, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Talla (cm)' }
            ],
            'm': [
                { minAge: 0, maxAge: 24, url: 'assets/curvas/te_m_0_2.png', xValue: edadMeses, yValue: talla, xMin: 0, xMax: 24, yMin: 45, yMax: 95, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Talla (cm)' },
                { minAge: 24, maxAge: 60, url: 'assets/curvas/te_m_2_5.png', xValue: edadMeses, yValue: talla, xMin: 24, xMax: 60, yMin: 80, yMax: 120, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Talla (cm)' },
                { minAge: 60, maxAge: 228, url: 'assets/curvas/te_m_5_19.png', xValue: edadMeses, yValue: talla, xMin: 60, xMax: 228, yMin: 100, yMax: 200, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'Talla (cm)' }
            ]
        },
        'pt': {
            'f': [
                { minTalla: 45, maxTalla: 110, url: 'assets/curvas/pt_f_0_2.png', xValue: talla, yValue: peso, xMin: 45, xMax: 110, yMin: 1, yMax: 23, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Talla (cm)', yName: 'Peso (kg)' },
                { minTalla: 65, maxTalla: 120, url: 'assets/curvas/pt_f_2_5.png', xValue: talla, yValue: peso, xMin: 65, xMax: 120, yMin: 6, yMax: 29, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Talla (cm)', yName: 'Peso (kg)' }
            ],
            'm': [
                { minTalla: 45, maxTalla: 110, url: 'assets/curvas/pt_m_0_2.png', xValue: talla, yValue: peso, xMin: 45, xMax: 110, yMin: 1, yMax: 23, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Talla (cm)', yName: 'Peso (kg)' },
                { minTalla: 65, maxTalla: 120, url: 'assets/curvas/pt_m_2_5.png', xValue: talla, yValue: peso, xMin: 65, xMax: 120, yMin: 6, yMax: 28, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Talla (cm)', yName: 'Peso (kg)' }
            ]
        },
        'pce': {
            'f': [
                { minAge: 0, maxAge: 24, url: 'assets/curvas/pce_f_0_2.png', xValue: edadMeses, yValue: pc, xMin: 0, xMax: 24, yMin: 30, yMax: 51, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'PC (cm)' }
            ],
            'm': [
                { minAge: 0, maxAge: 24, url: 'assets/curvas/pce_m_0_2.png', xValue: edadMeses, yValue: pc, xMin: 0, xMax: 24, yMin: 31, yMax: 52, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'PC (cm)' }
            ]
        },
        'imc': {
            'f': [
                { minAge: 60, maxAge: 228, url: 'assets/curvas/imc_f_5_19.png', xValue: edadMeses, yValue: imc, xMin: 60, xMax: 228, yMin: 12, yMax: 38, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'IMC (kg/m2)' }
            ],
            'm': [
                { minAge: 60, maxAge: 228, url: 'assets/curvas/imc_m_5_19.png', xValue: edadMeses, yValue: imc, xMin: 60, xMax: 228, yMin: 12, yMax: 36, pxLeft: 6.7, pxRight: 85.4, pxBottom: 7.5, pxTop: 84.5, xName: 'Meses', yName: 'IMC (kg/m2)' }
            ]
        },
        'pittaluga_peso': {
            'f': [{ url: 'assets/curvas/pittaluga_peso.png', xValue: egNeonatal, yValue: peso * 1000, xMin: 24, xMax: 42, yMin: 0, yMax: 4500, pxLeft: 8.5, pxRight: 94.5, pxBottom: 8.5, pxTop: 95.0, xName: 'EG Semanas', yName: 'Peso (g)' }],
            'm': [{ url: 'assets/curvas/pittaluga_peso.png', xValue: egNeonatal, yValue: peso * 1000, xMin: 24, xMax: 42, yMin: 0, yMax: 4500, pxLeft: 8.5, pxRight: 94.5, pxBottom: 8.5, pxTop: 95.0, xName: 'EG Semanas', yName: 'Peso (g)' }]
        },
        'pittaluga_talla_pc': {
            'f': [{ url: 'assets/curvas/pittaluga_talla_pc.png', xValue: egNeonatal, yValue: talla, yValue2: pc, xMin: 24, xMax: 42, yMin: 20, yMax: 55, pxLeft: 8.5, pxRight: 94.5, pxBottom: 8.5, pxTop: 95.0, xName: 'EG Semanas', yName: 'Talla/PC (cm)' }],
            'm': [{ url: 'assets/curvas/pittaluga_talla_pc.png', xValue: egNeonatal, yValue: talla, yValue2: pc, xMin: 24, xMax: 42, yMin: 20, yMax: 55, pxLeft: 8.5, pxRight: 94.5, pxBottom: 8.5, pxTop: 95.0, xName: 'EG Semanas', yName: 'Talla/PC (cm)' }]
        }
    };

    // Find the correct chart configuration
    let c = null;
    if (curveMeta[type] && curveMeta[type][sexo]) {
        const options = curveMeta[type][sexo];
        for (let opt of options) {
            if (opt.minAge !== undefined && edadMeses >= opt.minAge && edadMeses <= opt.maxAge) { c = opt; break; }
            if (opt.minTalla !== undefined && talla >= opt.minTalla && talla <= opt.maxTalla) { c = opt; break; }
            if (type === 'pittaluga_peso' || type === 'pittaluga_talla_pc') { c = opt; break; } // Pittaluga always maps
        }
        // Fallback to the first one if no exact match (so it at least shows something)
        if (!c && options.length > 0) c = options[0];
    }
    
    if (c) {
        img.src = c.url;
        img.onerror = () => { img.src = `https://placehold.co/800x600/8e44ad/ffffff?text=Falta+Imagen:+${encodeURIComponent(c.url)}`; };
        
        img.onload = () => {
            if (c.xValue > 0) {
                let x = Math.max(c.xMin, Math.min(c.xMax, c.xValue));
                let xPct = c.pxLeft + ((x - c.xMin) / (c.xMax - c.xMin)) * (c.pxRight - c.pxLeft);
                
                // Plot dot 1 if yValue is provided and > 0
                if (c.yValue > 0) {
                    let y = Math.max(c.yMin, Math.min(c.yMax, c.yValue));
                    let yPct = c.pxBottom + ((y - c.yMin) / (c.yMax - c.yMin)) * (c.pxTop - c.pxBottom);
                    
                    dot.style.left = `${xPct}%`;
                    dot.style.bottom = `${yPct}%`;
                    dot.style.display = 'block';
                } else {
                    dot.style.display = 'none';
                }
                
                // Plot dot 2 if yValue2 is provided (e.g., PC on pittaluga_talla_pc)
                if (type === 'pittaluga_talla_pc' && c.yValue2 > 0 && dot2) {
                    let y2 = Math.max(c.yMin, Math.min(c.yMax, c.yValue2));
                    let y2Pct = c.pxBottom + ((y2 - c.yMin) / (c.yMax - c.yMin)) * (c.pxTop - c.pxBottom);
                    
                    dot2.style.left = `${xPct}%`;
                    dot2.style.bottom = `${y2Pct}%`;
                    dot2.style.display = 'block';
                }
                
                // Auto-classification in PES diagnostic textbox
                let diag = document.getElementById('diagnosticoPES');
                let interpStr = `\n[Gráfico ${type.toUpperCase()}] ${c.xName}: ${c.xValue.toFixed(1)}, ${c.yName}: ${c.yValue.toFixed(1)}`;
                if (type === 'pittaluga_talla_pc') {
                    interpStr = `\n[Gráfico Pittaluga Talla & PC] EG: ${c.xValue.toFixed(1)} sem, Talla: ${c.yValue.toFixed(1)} cm, PC: ${c.yValue2.toFixed(1)} cm`;
                }
                if (diag && !diag.value.includes(`[Gráfico ${type.toUpperCase()}]`) && !diag.value.includes('[Gráfico Pittaluga Talla & PC]')) {
                    diag.value += interpStr;
                }
            }
        };
    } else {
        // Fallbacks (pittaluga, etc)
        img.src = `https://placehold.co/800x600/8e44ad/ffffff?text=Curva+No+Definida+o+Fuera+de+Rango`;
    }
};

window.updateCurveButtons = function() {
    const pType = document.querySelector('input[name="patientType"]:checked')?.value || 'adult';
    const pedia = document.getElementById('pediaCurves');
    const neo = document.getElementById('neoCurves');
    const adult = document.getElementById('adultCurves');
    
    if(!pedia || !neo || !adult) return;
    
    pedia.style.display = 'none';
    neo.style.display = 'none';
    adult.style.display = 'none';
    
    if(pType === 'pediatric') {
        pedia.style.display = 'flex';
    } else if(pType === 'neonate') {
        neo.style.display = 'flex';
    } else {
        adult.style.display = 'block';
    }
};

window.showFrisanchoHelp = () => {
    const modal = document.getElementById('frisanchoHelpModal');
    if (modal) modal.classList.add('active');
};

window.closeFrisanchoHelp = () => {
    const modal = document.getElementById('frisanchoHelpModal');
    if (modal) modal.classList.remove('active');
};

window.toggleFrisanchoTooltip = () => {
    const tooltip = document.getElementById('frisanchoTooltipBubble');
    if (tooltip) {
        const isOpen = tooltip.style.display === 'block';
        tooltip.style.display = isOpen ? 'none' : 'block';
    }
};

document.addEventListener('click', () => {
    const tooltip = document.getElementById('frisanchoTooltipBubble');
    if (tooltip) tooltip.style.display = 'none';
});



// ==========================================
// WARD-RESTRICTED HISTORY MODAL SYSTEM (V4.90)
// ==========================================
window.restrictedHistoryWard = null;

window.openWardHistory = () => {
    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) return;
    const activeLoc = JSON.parse(activeLocStr);
    
    // Set restriction flag
    window.restrictedHistoryWard = activeLoc.serviceName;
    
    // Open modal
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.add('active');
    
    // Show ward label and hide main filter dropdown
    const subtitle = document.getElementById('lblHistoryWardSubtitle');
    if (subtitle) {
        subtitle.innerText = `Sala: ${activeLoc.serviceName}`;
        subtitle.style.display = 'block';
    }
    const filterContainer = document.getElementById('historyFilterContainer');
    if (filterContainer) {
        filterContainer.style.display = 'none';
    }
    
    // Load history
    window.loadHistoryList(false);
};
// ==========================================
// MULTIMODAL OCR CENSUS IMPORT SYSTEM (V4.90)
// ==========================================
// --- NUTRI IA OCR CENSUS SYNC (V4.90) ---
// ==========================================

window.handleCensusUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) {
        alert("Por favor selecciona un piso y servicio primero en la vista de sala.");
        event.target.value = '';
        return;
    }

    showToast("🔍 Nutria OCR procesando captura de Dietools en tu navegador...");

    try {
        const activeLoc = JSON.parse(activeLocStr);
        const locationKey = `HRA-${activeLoc.floor}-${activeLoc.serviceId}`;

        let bedsList = getDefaultBeds(activeLoc.floor, activeLoc.serviceId);
        if (supabaseClient) {
            const { data: configRecord } = await supabaseClient
                .from('config_camas')
                .select('*')
                .eq('location_key', locationKey)
                .maybeSingle();
            if (configRecord && configRecord.beds && configRecord.beds.length > 0) {
                bedsList = configRecord.beds;
            }
        }

        if (!bedsList || bedsList.length === 0) {
            alert("No se encontraron camas configuradas para este servicio.");
            return;
        }

        // Load Tesseract.js dynamically if needed
        if (typeof Tesseract === 'undefined') {
            showToast("⌛ Cargando motor OCR en tu navegador...");
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }

        // Image preprocessing for maximum OCR accuracy on tabular printed sheets
        const preprocessedImg = await preprocessImageForOCR(file);

        const { data: { text } } = await Tesseract.recognize(preprocessedImg, 'spa');
        console.log("📄 Texto OCR extraído:", text);

        let extracted = parseDietoolsOCRText(text, bedsList);
        
        // Fallback: If OCR missed text or returned no patients, try raw image recognition
        const hasExtractedPatients = extracted.some(p => p.nombre || p.num_ficha);
        if (!hasExtractedPatients) {
            console.warn("Retrying OCR with original image...");
            const { data: { text: rawText } } = await Tesseract.recognize(file, 'spa');
            extracted = parseDietoolsOCRText(rawText, bedsList);
        }

        await showCensusReviewModal(extracted, bedsList, activeLoc);

    } catch (err) {
        console.error("Error al procesar censo con OCR local:", err);
        alert("Error al leer la foto con OCR local: " + (err.message || err));
    } finally {
        event.target.value = '';
    }
};

async function preprocessImageForOCR(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            // Grayscale & Contrast thresholding
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const v = avg < 160 ? 0 : 255;
                data[i] = v;
                data[i + 1] = v;
                data[i + 2] = v;
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(file);
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(file);
    });
}

function fixDietoolsEncoding(text) {
    if (!text) return '';
    return text
        .replace(/Ã\?/g, 'Ñ')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã\s/g, 'Á')
        .replace(/Ã/g, 'A');
}

function normalizeBedCode(str) {
    if (!str) return '';
    let s = str.trim().toUpperCase();
    // Normalize 501_01 -> 501-1, 501_1 -> 501-1, 501 01 -> 501-1
    s = s.replace(/[_ ]+/g, '-');
    s = s.replace(/-0+(\d+)/g, '-$1');
    return s.replace(/[^A-Z0-9-]/g, '');
}

window.formatPatientNameFirst = function(nameStr) {
    if (!nameStr) return '';
    let clean = nameStr.trim();
    if (clean.includes(',')) {
        const parts = clean.split(',');
        const apellidos = parts[0].trim();
        const nombres = parts[1].trim();
        if (nombres && apellidos) {
            return `${nombres} ${apellidos}`;
        }
    }
    return clean;
};

function isSamePatientOrMatch(pA, pB) {
    if (!pA || !pB) return false;
    const nameA = (pA.nombre || '').trim();
    const nameB = (pB.nombre || '').trim();
    if (!nameA || !nameB) return false;

    // Direct case-insensitive match
    if (nameA.toUpperCase() === nameB.toUpperCase()) return true;

    // Check ficha if both present
    const fA = (pA.num_ficha || pA.metadata?.num_ficha || '').toString().trim();
    const fB = (pB.num_ficha || pB.metadata?.num_ficha || '').toString().trim();
    if (fA && fB && fA.length >= 3 && fA === fB) return true;

    // Name token comparison ignoring accents, punctuation and short words
    const cleanTokens = (str) => {
        return str.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !['del', 'las', 'los', 'san', 'santa', 'edad'].includes(w));
    };

    const tokensA = cleanTokens(nameA);
    const tokensB = cleanTokens(nameB);
    if (tokensA.length === 0 || tokensB.length === 0) return false;

    const common = tokensA.filter(t => tokensB.includes(t));
    if (common.length >= 2) return true;
    if (common.length >= 1 && (tokensA.length === 1 || tokensB.length === 1)) return true;

    return false;
}

function parseDietoolsOCRText(ocrText, bedsList) {
    console.log("--- DIETOOLS PARSER INPUT ---", ocrText);
    const fixedText = fixDietoolsEncoding(ocrText);
    const rawLines = fixedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const parsedPatientsMap = {};
    let currentBedKey = null;

    rawLines.forEach(line => {
        // 1. Check if line starts with a bed code and optional ficha:
        // Handles hyphens, colons, tabs, and spaces (e.g., "501_01 - 759430", "501-1\t759430", "Cupo 1 - 759430", "AR 1\t759430")
        let rawBed = '';
        let ficha = '';
        let restOfLine = '';

        const bedMatchGeneral = line.match(/^((?:CAMA\s+|BOX\s+|CUPO\s+|AR\s+|UCI\s+|TIM\s+|UCO\s+|ONCO\s+)?[A-Z0-9]+[_\-\s]?\d{0,2})\s*[\-\:\t]\s*(\d{4,9})(.*)$/i)
            || line.match(/^([A-Z0-9]+[_\-\s]\d{1,2})\s+(\d{4,9})(.*)$/i);

        if (bedMatchGeneral) {
            rawBed = bedMatchGeneral[1].trim();
            ficha = bedMatchGeneral[2].trim();
            restOfLine = bedMatchGeneral[3] || '';
        } else if (Array.isArray(bedsList)) {
            // Check if line starts with any known bed name from bedsList
            for (const b of bedsList) {
                const escaped = b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const prefixM = line.match(new RegExp(`^(?:CAMA\\s+)?(${escaped})\\s*([\\-\\:\\t\\s])\\s*(.*)$`, 'i'));
                if (prefixM) {
                    rawBed = b;
                    const remainder = prefixM[3].trim();
                    const fM = remainder.match(/^(\d{4,9})\s*(.*)$/);
                    if (fM) {
                        ficha = fM[1];
                        restOfLine = fM[2];
                    } else {
                        restOfLine = remainder;
                    }
                    break;
                }
            }
        }

        if (rawBed) {
            const normBedKey = normalizeBedCode(rawBed);
            currentBedKey = normBedKey;

            // Extract Name and Edad
            let name = '';
            let edad = 0;

            const edadMatch = restOfLine.match(/(?:-\s*)?EDAD:\s*(\d{1,3})/i);
            if (edadMatch) {
                edad = parseInt(edadMatch[1]);
                const namePart = restOfLine.substring(0, edadMatch.index).trim();
                name = namePart.replace(/^[\t\s\-\:]+/, '').replace(/[\t\s\-\:]+$/, '').trim();
            } else {
                const nameMatch = restOfLine.match(/([A-ZÑÁÉÍÓÚ\s,]{4,})/i);
                if (nameMatch) {
                    name = nameMatch[1].replace(/\b(HPGL|HPPRT|REGCE|DIETA|LIVIANA|HIPOGLUCIDICA|HIPOSODICA)\b/gi, '').trim();
                }
            }

            // Clean name from status codes or trailing tabs
            name = name.replace(/\s*-\s*[NS]\s+[NS]$/i, '').replace(/[\t\r\n]/g, '').trim();
            name = window.formatPatientNameFirst ? window.formatPatientNameFirst(name) : name;

            if (name.length <= 2) {
                const wordsM = restOfLine.match(/([A-ZÑÁÉÍÓÚ]{3,}(?:\s+[A-ZÑÁÉÍÓÚ]{2,}){1,4})/i);
                if (wordsM) name = wordsM[1].trim();
            }

            // Extract regimen
            let regimen = '';
            if (/HPGL|HIPOGLUCIDICA/i.test(line)) regimen = 'Dieta Hipoglucídica';
            else if (/HPPRT|HIPERPROTEICA/i.test(line)) regimen = 'Dieta Hiperproteica';
            else if (/CHANLI|CHANCADO LIVIANO/i.test(line)) regimen = 'Chancado Liviano';
            else if (/CHANDI|CHANCADO DIABETICO/i.test(line)) regimen = 'Chancado Diabético';
            else if (/PAPLI|PAPILLA/i.test(line)) regimen = 'Papilla Liviana';
            else if (/HIPOSODICA|HPSD/i.test(line)) regimen = 'Dieta Hiposódica';
            else if (/REGCE|REGIMEN CERO/i.test(line)) regimen = 'Régimen Cero';
            else if (/LIQFR|LIQUIDA FRIA/i.test(line)) regimen = 'Dieta Líquida Fría';
            else if (/LIV|LIVIANA/i.test(line)) regimen = 'Dieta Liviana';
            else if (/BLANDA/i.test(line)) regimen = 'Dieta Blanda';
            else if (/ISOGL|ISOGLUCIDICO/i.test(line)) regimen = 'Isoglucídico';
            else if (/SRES|SIN RESIDUO/i.test(line)) regimen = 'Sin Residuo';
            else if (/COM|COMUN|NORMAL/i.test(line)) regimen = 'Dieta Común';

            const isDM = /DIABÉTICO|DIABETICO|HPGL|HIPOGLUCIDICA|CHANDI|ISOGL/i.test(line);

            let obsList = [];
            if (line.includes('NO LECHE')) obsList.push('NO LECHE');

            parsedPatientsMap[normBedKey] = {
                rawBed: rawBed,
                normBed: normBedKey,
                nombre: name,
                num_ficha: ficha,
                edad: edad,
                regimen: regimen,
                patologia_dm: isDM,
                observaciones: obsList
            };
        } else if (currentBedKey && parsedPatientsMap[currentBedKey]) {
            // Subsequent lines for current bed entry
            const pObj = parsedPatientsMap[currentBedKey];
            if (line.startsWith('ALERGIAS:')) {
                const algVal = line.replace('ALERGIAS:', '').trim();
                if (algVal) pObj.observaciones.push('ALERGIAS: ' + algVal);
            } else if (line.startsWith('OBSERVACIONES POR INGESTA:')) {
                const obsVal = line.replace('OBSERVACIONES POR INGESTA:', '').trim();
                if (obsVal) pObj.observaciones.push('OBS: ' + obsVal);
            } else if (/^(LACTEOS|SACAROSA|VACUNO|PESCADOS|PLATANO|FRUTILLAS)$/i.test(line)) {
                pObj.observaciones.push('ALERGIA: ' + line.trim());
            } else if (line.includes('NO LECHE')) {
                pObj.observaciones.push('NO LECHE');
            }
        }
    });

    // Map results back to current ward's bedsList
    return bedsList.map(bedName => {
        const normTargetBed = normalizeBedCode(bedName);
        let matchData = parsedPatientsMap[normTargetBed];

        if (!matchData) {
            const targetDigits = bedName.replace(/[^0-9]/g, '');
            for (const k in parsedPatientsMap) {
                if (targetDigits.length > 0 && k.replace(/[^0-9]/g, '') === targetDigits) {
                    matchData = parsedPatientsMap[k];
                    break;
                }
            }
        }

        if (matchData) {
            return {
                cama: bedName,
                nombre: matchData.nombre,
                num_ficha: matchData.num_ficha,
                edad: matchData.edad,
                regimen: matchData.regimen,
                patologia_dm: matchData.patologia_dm,
                observaciones: matchData.observaciones.join(' | ')
            };
        }

        return { cama: bedName, nombre: '', num_ficha: '', edad: 0, regimen: '', patologia_dm: false, observaciones: '' };
    });
}

window.pendingCensusChanges = [];

window.openPasteCensusModal = function() {
    const modal = document.getElementById('pasteCensusModal');
    if (modal) modal.classList.add('active');
};

window.closePasteCensusModal = function() {
    const modal = document.getElementById('pasteCensusModal');
    if (modal) modal.classList.remove('active');
};

window.processPastedCensusText = async function() {
    const txtInput = document.getElementById('txtPasteCensusInput');
    const rawText = txtInput ? txtInput.value.trim() : '';
    if (!rawText) {
        alert("Por favor pega el texto de la planilla de Dietools en el recuadro.");
        return;
    }

    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) {
        alert("Por favor selecciona un piso y servicio primero en la vista de sala.");
        return;
    }

    const activeLoc = JSON.parse(activeLocStr);
    const locationKey = `HRA-${activeLoc.floor}-${activeLoc.serviceId}`;

    let bedsList = getDefaultBeds(activeLoc.floor, activeLoc.serviceId);
    if (supabaseClient) {
        const { data: configRecord } = await supabaseClient
            .from('config_camas')
            .select('*')
            .eq('location_key', locationKey)
            .maybeSingle();
        if (configRecord && configRecord.beds && configRecord.beds.length > 0) {
            bedsList = configRecord.beds;
        }
    }

    const extracted = parseDietoolsOCRText(rawText, bedsList);
    window.closePasteCensusModal();
    await showCensusReviewModal(extracted, bedsList, activeLoc);
};

window.closeCensusReviewModal = function() {
    const modal = document.getElementById('censusReviewModal');
    if (modal) modal.classList.remove('active');
};

async function showCensusReviewModal(extracted, bedsList, activeLoc) {
    let activePatients = [];
    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('pacientes')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) {
            activePatients = data.filter(p => p.estado_sala !== 'de_alta' && p.estado_sala !== 'eliminado');
        }
    }

    // Merge local storage cache safely so we don't miss active local patients
    try {
        const localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        localCache.forEach(lp => {
            if (!lp || lp.estado_sala === 'de_alta' || lp.estado_sala === 'eliminado') return;
            const idx = activePatients.findIndex(ap => (ap.id === lp.id) || (ap.cama && lp.cama && ap.cama.trim().toUpperCase() === lp.cama.trim().toUpperCase()));
            if (idx >= 0) {
                activePatients[idx] = { ...activePatients[idx], ...lp };
            } else {
                activePatients.push(lp);
            }
        });
    } catch(e) {}
    
    const matchedPatients = activePatients.filter(p => {
        if (p.metadata && p.metadata.location && p.metadata.location.serviceId) {
            const locFloor = p.metadata.location.floor;
            if (locFloor && activeLoc.floor && String(locFloor) !== String(activeLoc.floor)) {
                return false;
            }
            return p.metadata.location.serviceId === activeLoc.serviceId;
        }
        return bedsList.includes(p.cama);
    });

    const changesListEl = document.getElementById('censusChangesList');
    if (!changesListEl) return;
    
    changesListEl.innerHTML = '';
    window.pendingCensusChanges = [];
    
    let hasChanges = false;
    let keptCount = 0;
    
    bedsList.forEach(bedName => {
        const currentPat = matchedPatients.find(p => p.cama === bedName);
        const extPat = extracted.find(e => e.cama === bedName);
        const hasExtData = extPat && extPat.nombre && extPat.nombre.trim() !== '';
        
        if (!currentPat && hasExtData) {
            // New patient admission
            hasChanges = true;
            window.pendingCensusChanges.push({
                type: 'admission',
                bed: bedName,
                name: extPat.nombre.trim(),
                num_ficha: extPat.num_ficha || '',
                edad: extPat.edad ? parseInt(extPat.edad) : 0,
                regimen: extPat.regimen || '',
                patologia_dm: !!extPat.patologia_dm,
                observaciones: extPat.observaciones || ''
            });
            changesListEl.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#e8f8f5; border:1px solid #a3e4d7; border-radius:8px; padding:10px 12px; font-size:0.85rem; color:#16a085;">
                    <div><strong style="color:#117a65;">🟢 Nuevo Ingreso:</strong> Cama <b>${bedName}</b> ${extPat.num_ficha ? '(Ficha: ' + extPat.num_ficha + ')' : ''}</div>
                    <div><b>${extPat.nombre}</b></div>
                </div>`;
        } else if (currentPat && hasExtData) {
            if (isSamePatientOrMatch(currentPat, extPat)) {
                // Same patient! Update diet/regimen/ficha without discharging
                const newRegimen = extPat.regimen && extPat.regimen !== currentPat.metadata?.regimen;
                const newFicha = extPat.num_ficha && extPat.num_ficha !== (currentPat.metadata?.num_ficha || '');
                const newDm = extPat.patologia_dm !== !!currentPat.metadata?.patologia_dm;
                const newObs = extPat.observaciones && extPat.observaciones !== (currentPat.metadata?.observaciones_generales || '');

                if (newRegimen || newFicha || newDm || newObs) {
                    hasChanges = true;
                    window.pendingCensusChanges.push({
                        type: 'update',
                        bed: bedName,
                        patientId: currentPat.id,
                        name: currentPat.nombre,
                        num_ficha: extPat.num_ficha || currentPat.metadata?.num_ficha || '',
                        edad: extPat.edad || currentPat.edad || 0,
                        regimen: extPat.regimen || currentPat.metadata?.regimen || '',
                        patologia_dm: extPat.patologia_dm !== undefined ? extPat.patologia_dm : !!currentPat.metadata?.patologia_dm,
                        observaciones: extPat.observaciones || currentPat.metadata?.observaciones_generales || ''
                    });
                    changesListEl.innerHTML += `
                        <div style="display:flex; justify-content:space-between; align-items:center; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 12px; font-size:0.85rem; color:#1d4ed8;">
                            <div><strong style="color:#1e40af;">🔄 Actualización:</strong> Cama <b>${bedName}</b> (Mismo paciente)</div>
                            <div><b>${currentPat.nombre}</b> ${extPat.regimen ? '<span style="font-size:0.75rem; color:#475569;">(' + extPat.regimen + ')</span>' : ''}</div>
                        </div>`;
                }
            } else {
                // Different patient in bed: Move current patient to "Pacientes que ya no están en el servicio" (cama: '')
                // NEVER discharge automatically!
                hasChanges = true;
                window.pendingCensusChanges.push({
                    type: 'replace',
                    bed: bedName,
                    oldPatientId: currentPat.id,
                    oldName: currentPat.nombre,
                    name: extPat.nombre.trim(),
                    num_ficha: extPat.num_ficha || '',
                    edad: extPat.edad ? parseInt(extPat.edad) : 0,
                    regimen: extPat.regimen || '',
                    patologia_dm: !!extPat.patologia_dm,
                    observaciones: extPat.observaciones || ''
                });
                changesListEl.innerHTML += `
                    <div style="display:flex; flex-direction:column; gap:6px; background:#fef9e7; border:1px solid #fdebd0; border-radius:8px; padding:10px 12px; font-size:0.85rem; color:#b7950b;">
                        <div style="display:flex; justify-content:space-between;">
                            <div><strong style="color:#b9770e;">🔄 Relevo de Cama:</strong> Cama <b>${bedName}</b></div>
                            <div><b>${extPat.nombre}</b></div>
                        </div>
                        <div style="font-size:0.75rem; color:#78350f; border-top:1px dashed #fdebd0; padding-top:4px;">
                            ℹ️ <i>${currentPat.nombre}</i> se traslada a "Pacientes que ya no están en el servicio" (no se da de alta).
                        </div>
                    </div>`;
            }
        } else if (currentPat && !hasExtData) {
            // Patient currently in bed, but DieTools didn't list this bed:
            // ALWAYS KEEP THE PATIENT IN BED! NEVER AUTO-DISCHARGE!
            keptCount++;
        }
    });

    if (keptCount > 0) {
        changesListEl.innerHTML += `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:0.8rem; color:#475569;">
                🛡️ <b>${keptCount} paciente(s)</b> continúan en sus camas asignadas (no se dan de alta automáticamente).
            </div>`;
    }

    if (!hasChanges) {
        const anyExtracted = extracted.some(e => e.nombre && e.nombre.trim() !== '');
        if (!anyExtracted && matchedPatients.length === 0) {
            changesListEl.innerHTML = `
                <div style="background:#fff3cd; border:1px solid #ffeeba; border-radius:8px; padding:15px; color:#856404; font-size:0.85rem; text-align:center;">
                    <p style="margin:0 0 8px 0; font-weight:700;">⚠️ No se leyeron camas o nombres en el texto pegado.</p>
                    <p style="margin:0 0 12px 0; font-size:0.8rem;">Verifica que el texto contenga el formato de la planilla de Dietools.</p>
                    <button class="btn-micro" style="background:#059669; color:white; font-weight:700; padding:8px 16px; border-radius:6px; cursor:pointer;" onclick="window.closeCensusReviewModal(); window.openPasteCensusModal();">📋 Reintentar Pegar Texto</button>
                </div>`;
        } else {
            changesListEl.innerHTML = '<p style="text-align:center; color:#475569; padding: 20px 0;">Todos los pacientes registrados coinciden con los datos de Dietools. No se requieren cambios.</p>';
        }
    }
    
    const modal = document.getElementById('censusReviewModal');
    if (modal) modal.classList.add('active');
}

window.applyCensusChanges = async function() {
    if (!window.pendingCensusChanges || window.pendingCensusChanges.length === 0) {
        const modal = document.getElementById('censusReviewModal');
        if (modal) modal.classList.remove('active');
        return;
    }
    
    // 1. Close modal instantly
    const modal = document.getElementById('censusReviewModal');
    if (modal) modal.classList.remove('active');

    const activeLocStr = localStorage.getItem('activeLocation');
    const activeLoc = activeLocStr ? JSON.parse(activeLocStr) : { floor: 7, serviceId: 'ala_d', serviceName: 'Ala D' };
    
    let localPatients = [];
    try {
        localPatients = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
    } catch(e) {
        localPatients = [];
    }

    let currentUserId = AppState?.user?.id;
    if (!currentUserId && supabaseClient) {
        try {
            const { data: uData } = await supabaseClient.auth.getUser();
            if (uData && uData.user) currentUserId = uData.user.id;
        } catch(e) {}
    }

    const pending = [...window.pendingCensusChanges];
    window.pendingCensusChanges = [];

    // 2. Update local storage cache INSTANTLY
    pending.forEach(change => {
        if (change.type === 'admission') {
            const formattedName = window.formatPatientNameFirst ? window.formatPatientNameFirst(change.name) : change.name;
            const newPatientData = {
                id: 'pat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                nombre: formattedName,
                edad: change.edad || 0,
                peso_kg: 0,
                estatura_m: 0,
                sexo: 'm',
                actividad: 1.2,
                diagnostico: '',
                cama: change.bed,
                estado_sala: 'activo',
                tmt: 0,
                ia_report: null,
                created_at: new Date().toISOString(),
                user_id: currentUserId || null,
                metadata: {
                    num_ficha: change.num_ficha || '',
                    regimen: change.regimen || '',
                    patologia_dm: !!change.patologia_dm,
                    observaciones_generales: change.observaciones || '',
                    location: {
                        floor: activeLoc.floor,
                        serviceId: activeLoc.serviceId,
                        serviceName: activeLoc.serviceName
                    }
                }
            };
            localPatients = localPatients.filter(p => p.cama !== change.bed);
            localPatients.push(newPatientData);
        } else if (change.type === 'update') {
            const pat = localPatients.find(p => p.id === change.patientId || p.cama === change.bed);
            if (pat) {
                pat.metadata = pat.metadata || {};
                if (change.num_ficha) pat.metadata.num_ficha = change.num_ficha;
                if (change.regimen) pat.metadata.regimen = change.regimen;
                if (change.patologia_dm !== undefined) pat.metadata.patologia_dm = change.patologia_dm;
                if (change.observaciones) pat.metadata.observaciones_generales = change.observaciones;
                if (change.edad) pat.edad = change.edad;
            }
        } else if (change.type === 'replace') {
            // Previous patient moves to floating (cama: '') without discharging
            const oldPat = localPatients.find(p => p.id === change.oldPatientId || p.cama === change.bed);
            if (oldPat) {
                oldPat.cama = '';
            }
            // Admit new patient to bed
            const formattedName = window.formatPatientNameFirst ? window.formatPatientNameFirst(change.name) : change.name;
            const newPatientData = {
                id: 'pat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                nombre: formattedName,
                edad: change.edad || 0,
                peso_kg: 0,
                estatura_m: 0,
                sexo: 'm',
                actividad: 1.2,
                diagnostico: '',
                cama: change.bed,
                estado_sala: 'activo',
                tmt: 0,
                ia_report: null,
                created_at: new Date().toISOString(),
                user_id: currentUserId || null,
                metadata: {
                    num_ficha: change.num_ficha || '',
                    regimen: change.regimen || '',
                    patologia_dm: !!change.patologia_dm,
                    observaciones_generales: change.observaciones || '',
                    location: {
                        floor: activeLoc.floor,
                        serviceId: activeLoc.serviceId,
                        serviceName: activeLoc.serviceName
                    }
                }
            };
            localPatients = localPatients.filter(p => (oldPat && p.id === oldPat.id) ? true : p.cama !== change.bed);
            localPatients.push(newPatientData);
        }
    });

    localStorage.setItem('local_ward_patients', JSON.stringify(localPatients));
    
    // 3. Render table INSTANTLY!
    await window.renderWardBedsGrid();
    showToast("🎉 ¡Censo sincronizado exitosamente sin perder pacientes!");

    // 4. Fast Parallel Sync to Supabase
    if (supabaseClient) {
        (async () => {
            try {
                const tasks = pending.map(async (change) => {
                    try {
                        if (change.type === 'admission') {
                            const formattedName = window.formatPatientNameFirst ? window.formatPatientNameFirst(change.name) : change.name;
                            const dbPayload = {
                                nombre: formattedName,
                                edad: change.edad || 0,
                                cama: change.bed,
                                estado_sala: 'activo',
                                user_id: currentUserId || null,
                                metadata: {
                                    num_ficha: change.num_ficha || '',
                                    regimen: change.regimen || '',
                                    patologia_dm: !!change.patologia_dm,
                                    observaciones_generales: change.observaciones || '',
                                    location: {
                                        floor: activeLoc.floor,
                                        serviceId: activeLoc.serviceId,
                                        serviceName: activeLoc.serviceName
                                    }
                                }
                            };
                            const { data: inserted, error } = await supabaseClient.from('pacientes').insert([dbPayload]).select('id, created_at').single();
                            if (!error && inserted) {
                                try {
                                    let curCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
                                    const matchItem = curCache.find(p => p.cama === change.bed && p.nombre === formattedName);
                                    if (matchItem) {
                                        matchItem.id = inserted.id;
                                        matchItem.created_at = inserted.created_at;
                                        localStorage.setItem('local_ward_patients', JSON.stringify(curCache));
                                    }
                                } catch(e) {}
                            }
                        } else if (change.type === 'update') {
                            const dbId = change.patientId;
                            if (dbId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbId)) {
                                const { data: existing } = await supabaseClient.from('pacientes').select('metadata').eq('id', dbId).maybeSingle();
                                const meta = { ...(existing?.metadata || {}) };
                                if (change.num_ficha) meta.num_ficha = change.num_ficha;
                                if (change.regimen) meta.regimen = change.regimen;
                                if (change.patologia_dm !== undefined) meta.patologia_dm = change.patologia_dm;
                                if (change.observaciones) meta.observaciones_generales = change.observaciones;
                                
                                await supabaseClient.from('pacientes').update({
                                    metadata: meta,
                                    edad: change.edad || undefined
                                }).eq('id', dbId);
                            }
                        } else if (change.type === 'replace') {
                            // Move old patient to floating
                            if (change.oldPatientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(change.oldPatientId)) {
                                await supabaseClient.from('pacientes').update({ cama: '' }).eq('id', change.oldPatientId);
                            }
                            // Insert new patient
                            const formattedName = window.formatPatientNameFirst ? window.formatPatientNameFirst(change.name) : change.name;
                            const dbPayload = {
                                nombre: formattedName,
                                edad: change.edad || 0,
                                cama: change.bed,
                                estado_sala: 'activo',
                                user_id: currentUserId || null,
                                metadata: {
                                    num_ficha: change.num_ficha || '',
                                    regimen: change.regimen || '',
                                    patologia_dm: !!change.patologia_dm,
                                    observaciones_generales: change.observaciones || '',
                                    location: {
                                        floor: activeLoc.floor,
                                        serviceId: activeLoc.serviceId,
                                        serviceName: activeLoc.serviceName
                                    }
                                }
                            };
                            const { data: inserted, error } = await supabaseClient.from('pacientes').insert([dbPayload]).select('id, created_at').single();
                            if (!error && inserted) {
                                try {
                                    let curCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
                                    const matchItem = curCache.find(p => p.cama === change.bed && p.nombre === formattedName);
                                    if (matchItem) {
                                        matchItem.id = inserted.id;
                                        matchItem.created_at = inserted.created_at;
                                        localStorage.setItem('local_ward_patients', JSON.stringify(curCache));
                                    }
                                } catch(e) {}
                            }
                        }
                    } catch(itemErr) {
                        console.warn("Background sync error for item:", change, itemErr);
                    }
                });
                await Promise.all(tasks);
            } catch(syncErr) {
                console.warn("Background batch sync warning:", syncErr);
            }
        })();
    }
};

window.initCensusModal = () => {
    document.getElementById('btnCensusReviewClose')?.addEventListener('click', () => {
        document.getElementById('censusReviewModal')?.classList.remove('active');
    });
    document.getElementById('btnCensusCancel')?.addEventListener('click', () => {
        document.getElementById('censusReviewModal')?.classList.remove('active');
    });
    document.getElementById('btnCensusConfirm')?.addEventListener('click', window.applyCensusChanges);
    
    const censusInput = document.getElementById('censusFileInput');
    if (censusInput && !censusInput.dataset.bound) {
        censusInput.addEventListener('change', window.handleCensusUpload);
        censusInput.dataset.bound = "true";
    }
};

// ==========================================
// ENVIRONMENT SELECTOR & BEDS GRID SYSTEM (V4.80)
// ==========================================

const SERVICES_BY_FLOOR = {
    1: [
        { id: 'urgencias', name: '🏥 Unidad de Emergencia', type: 'adult' },
        { id: 'neonatologia_cuidados_basicos', name: '👶 Neonatología CB', type: 'neonate' },
        { id: 'neonatologia_uci', name: '👶 Neonatología UCI', type: 'neonate' },
        { id: 'neonatologia_tim', name: '👶 Neonatología TIM', type: 'neonate' }
    ],
    2: [
        { id: 'uci_adulto', name: '🩺 UCI Adultos', type: 'adult' },
        { id: 'tim_adulto', name: '🩺 TIM Adultos', type: 'adult' }
    ],
    3: [
        { id: 'uco', name: '🫀 UCI Coronaria (UCO)', type: 'adult' },
        { id: 'uciped', name: '🧸 UCIPED (UCP Ped. UCI)', type: 'pediatric' },
        { id: 'timped', name: '🧸 TIMPED (UCP Ped. TIM)', type: 'pediatric' },
        { id: 'pediatria_lactantes', name: '👶 Pediatría Lactantes (Ala A)', type: 'pediatric' },
        { id: 'segunda_infancia', name: '🧒 II Infancia', type: 'pediatric' },
        { id: 'cirugia_infantil', name: '🍼 Cirugía Infantil', type: 'pediatric' },
        { id: 'oncologia_pediatrica', name: '🎗️ Oncología Pediátrica', type: 'pediatric' }
    ],
    4: [
        { id: 'aro', name: '🤱 ARO (Ala A)', type: 'adult' },
        { id: 'ginecologia', name: '🤰 Ginecología (Ala B)', type: 'adult' },
        { id: 'puerperio', name: '🤱 Puerperio (Ala D)', type: 'adult' },
        { id: 'rn_ala_a', name: '👶 RN Ala A', type: 'neonate' },
        { id: 'rn_ala_d', name: '👶 RN Ala D', type: 'neonate' }
    ],
    5: [
        { id: 'ala_a', name: '🏢 Cirugía Básica (Ala A)', type: 'adult' },
        { id: 'ala_b', name: '🏢 Cirugía UCM (Ala B)', type: 'adult' },
        { id: 'ala_c', name: '🏢 Cirugía UCM (Ala C)', type: 'adult' },
        { id: 'ala_d', name: '🏢 Bloque QX Especialidades (Ala D)', type: 'adult' }
    ],
    6: [
        { id: 'ala_a', name: '🏢 UCM Neurología (Ala A)', type: 'adult' },
        { id: 'ala_b', name: '🏢 Oncología Adultos (Ala B)', type: 'adult' },
        { id: 'ala_c', name: '🏢 Medicina (Ala C)', type: 'adult' },
        { id: 'ala_d', name: '🏢 Medicina UCM (Ala D)', type: 'adult' }
    ],
    7: [
        { id: 'ala_a', name: '🏢 Cardiología UCM (Ala A)', type: 'adult' },
        { id: 'ala_b', name: '🏢 Psiquiatría Infanto Juvenil (Ala B)', type: 'pediatric' },
        { id: 'ala_c', name: '🏢 Médico Quirúrgico (Ala C)', type: 'adult' },
        { id: 'ala_d', name: '🏢 TIM Adultos - Cardiología QX (Ala D)', type: 'adult' }
    ],
    8: [
        { id: 'ala_a', name: '🏢 Psiquiatría Adultos (Ala A)', type: 'adult' },
        { id: 'ala_b', name: '🏢 Psiquiatría Adultos (Ala B)', type: 'adult' }
    ]
};

let selectedHospital = 'hra';
let selectedFloor = null;
let selectedService = null;
let canCancelSelection = false;

window.openLocationSelector = function(allowCancel = false) {
    canCancelSelection = allowCancel;
    const overlay = document.getElementById('location-selector-screen');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    
    // Reset floor select & service select UI
    selectedFloor = null;
    selectedService = null;
    
    const floorSelectSection = document.getElementById('floor-select-section');
    const serviceSelectSection = document.getElementById('service-select-section');
    const btnConfirm = document.getElementById('btnConfirmLocation');
    
    if (floorSelectSection) floorSelectSection.style.display = 'none';
    if (serviceSelectSection) serviceSelectSection.style.display = 'none';
    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.style.opacity = '0.5';
    }
    
    // Reset active floor buttons
    const floorBtns = document.querySelectorAll('.floor-btn');
    floorBtns.forEach(btn => btn.classList.remove('active'));

    // Highlight selected hospital card
    const hospitalCards = document.querySelectorAll('.hospital-card');
    hospitalCards.forEach(c => c.classList.remove('active'));
};

window.selectHospitalCard = function() {
    const card = document.querySelector('.hospital-card');
    if (card) card.classList.add('active');
    
    const floorSelectSection = document.getElementById('floor-select-section');
    if (floorSelectSection) {
        floorSelectSection.style.display = 'block';
        floorSelectSection.scrollIntoView({ behavior: 'smooth' });
    }
};

window.selectFloorBtn = function(floor) {
    selectedFloor = floor;
    
    // Highlight floor button
    const floorBtns = document.querySelectorAll('.floor-btn');
    floorBtns.forEach(btn => {
        if (btn.innerText.includes(floor)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Render services for this floor
    const servicesGrid = document.getElementById('servicesGrid');
    const floorSelectSection = document.getElementById('floor-select-section');
    const serviceSelectSection = document.getElementById('service-select-section');
    
    if (servicesGrid) {
        servicesGrid.innerHTML = '';
        const services = SERVICES_BY_FLOOR[floor] || [];
        
        services.forEach(srv => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.setAttribute('data-service-id', srv.id);
            card.innerHTML = `
                <div style="font-weight:700; font-size:0.95rem;">${srv.name}</div>
                <span class="patient-type-badge ${srv.type}">${srv.type === 'pediatric' ? '👶 Pediátrico' : srv.type === 'neonate' ? '👶 Neonato' : srv.type === 'comm' ? '🧪 CEFE' : '🩺 Adulto'}</span>
            `;
            card.onclick = () => window.selectServiceCard(srv.id, srv.name, srv.type);
            servicesGrid.appendChild(card);
        });
    }
    
    if (floorSelectSection) floorSelectSection.style.display = 'none';
    if (serviceSelectSection) {
        serviceSelectSection.style.display = 'block';
        serviceSelectSection.scrollIntoView({ behavior: 'smooth' });
    }
};

window.goBackToFloors = function() {
    const floorSelectSection = document.getElementById('floor-select-section');
    const serviceSelectSection = document.getElementById('service-select-section');
    if (floorSelectSection) floorSelectSection.style.display = 'block';
    if (serviceSelectSection) serviceSelectSection.style.display = 'none';
};

window.selectServiceCard = function(serviceId, serviceName, patientType) {
    selectedService = { id: serviceId, name: serviceName, type: patientType };
    
    // Highlight selected service card
    const cards = document.querySelectorAll('.service-card');
    cards.forEach(card => {
        if (card.getAttribute('data-service-id') === serviceId) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    const btnConfirm = document.getElementById('btnConfirmLocation');
    if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.style.opacity = '1';
        btnConfirm.scrollIntoView({ behavior: 'smooth' });
    }
};

window.confirmLocationSelection = async function() {
    if (!selectedFloor || !selectedService) return;
    
    const locationObj = {
        hospitalId: 'hra',
        floor: selectedFloor,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        type: selectedService.type
    };
    
    localStorage.setItem('activeLocation', JSON.stringify(locationObj));
    
    // Sync patient type in main app
    if (selectedService.type === 'pediatric') {
        AppState.patient.type = 'pediatric';
        if (typeof window.setPatientTypeUI === 'function') window.setPatientTypeUI('pediatric');
    } else if (selectedService.type === 'neonate') {
        AppState.patient.type = 'neonate';
        if (typeof window.setPatientTypeUI === 'function') window.setPatientTypeUI('neonate');
    } else {
        AppState.patient.type = 'adult';
        if (typeof window.setPatientTypeUI === 'function') window.setPatientTypeUI('adult');
    }
    
    window.updateActiveLocationBadge();
    if (typeof window.syncPatientTypeSelector === 'function') {
        window.syncPatientTypeSelector();
    }
    
    const overlay = document.getElementById('location-selector-screen');
    if (overlay) overlay.style.display = 'none';
    
    // Refresh main app screen layout
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.style.display = 'block';
    
    // Reload the Interactive Bed Grid!
    await window.renderWardBedsGrid();
    
    showToast(`📍 Ubicación cambiada a: ${selectedService.name}`);
};

window.updateActiveLocationBadge = function() {
    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) return;
    
    const activeLoc = JSON.parse(activeLocStr);
    
    const badge = document.getElementById('activeLocationBadge');
    if (badge) {
        badge.innerHTML = `📍 HRA: ${activeLoc.serviceName} (Piso ${activeLoc.floor})`;
    }
    
    const subLabel = document.getElementById('activeWardSubLabel');
    if (subLabel) {
        subLabel.innerHTML = `Visualizando camas del servicio <b>${activeLoc.serviceName}</b> en el Piso ${activeLoc.floor}.`;
    }
};

window.toggleWardViewMode = function() {
    const select = document.getElementById('wardViewModeSelect');
    if (!select) return;
    localStorage.setItem('wardViewMode', select.value);
    
    const btnPrintSheet = document.getElementById('btnPrintSheetTable');
    if (btnPrintSheet) {
        btnPrintSheet.style.display = select.value === 'table' ? 'inline-flex' : 'none';
    }

    window.renderWardBedsGrid();
};

window.printCensusSheetTable = function() {
    const select = document.getElementById('wardViewModeSelect');
    if (select && select.value !== 'table') {
        select.value = 'table';
        window.toggleWardViewMode();
    }
    document.body.classList.add('printing-sheet-table');
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing-sheet-table');
        }, 500);
    }, 300);
};

window.parseSmartHeight = function(val) {
    if (val === null || val === undefined || val === '') return { meters: 0, cm: 0 };
    let num = parseFloat(String(val).replace(',', '.'));
    if (isNaN(num) || num <= 0) return { meters: 0, cm: 0 };

    let meters = num;
    let cm = num;

    if (num > 3) {
        // Entered in CM (e.g. 166 -> 1.66 m, 166 cm)
        meters = num / 100;
        cm = num;
    } else {
        // Entered in Meters (e.g. 1.66 -> 1.66 m, 166 cm)
        meters = num;
        cm = num * 100;
    }
    return { meters: parseFloat(meters.toFixed(4)), cm: Math.round(cm) };
};

window.computeNutritionalStatusAbbrev = function(imcNum, age) {
    if (!imcNum || isNaN(imcNum) || imcNum <= 0) return { abbrev: '--', bgStyle: 'background:#dcfce7; color:#166534; font-weight:700;' };
    const isElderly = (age || 0) >= 65;
    if (isElderly) {
        if (imcNum < 23) return { abbrev: 'BP', bgStyle: 'background:#fee2e2; color:#991b1b; font-weight:800;' };
        if (imcNum < 28) return { abbrev: 'N', bgStyle: 'background:#dcfce7; color:#166534; font-weight:700;' };
        if (imcNum < 32) return { abbrev: 'SP', bgStyle: 'background:#fef3c7; color:#92400e; font-weight:700;' };
        return { abbrev: 'OB', bgStyle: 'background:#ffedd5; color:#c2410c; font-weight:700;' };
    } else {
        if (imcNum < 18.5) return { abbrev: 'BP', bgStyle: 'background:#fee2e2; color:#991b1b; font-weight:800;' };
        if (imcNum < 25) return { abbrev: 'N', bgStyle: 'background:#dcfce7; color:#166534; font-weight:700;' };
        if (imcNum < 30) return { abbrev: 'SP', bgStyle: 'background:#fef3c7; color:#92400e; font-weight:700;' };
        return { abbrev: 'OB', bgStyle: 'background:#ffedd5; color:#c2410c; font-weight:700;' };
    }
};

window.calculateTableIMC = function(patientId) {
    const row = document.getElementById(`row_pat_${patientId}`);
    if (!row) return;

    const pesoInput = row.querySelector('.input-table-peso');
    const tallaInput = row.querySelector('.input-table-talla');
    const imcCell = document.getElementById(`table_imc_${patientId}`);
    const estCell = document.getElementById(`table_est_${patientId}`);

    if (!pesoInput || !tallaInput || !imcCell || !estCell) return;

    const peso = parseFloat(pesoInput.value) || 0;
    const rawTalla = tallaInput.value;
    const { meters } = window.parseSmartHeight(rawTalla);

    if (peso > 0 && meters > 0) {
        const imcNum = peso / (meters * meters);
        imcCell.innerText = imcNum.toFixed(1).replace('.', ',');

        const age = parseFloat(row.dataset.age) || 0;
        const { abbrev, bgStyle } = window.computeNutritionalStatusAbbrev(imcNum, age);
        estCell.innerText = abbrev;
        estCell.style = `padding: 6px 10px; text-align: center; ${bgStyle}`;
    } else {
        imcCell.innerText = '--';
        estCell.innerText = '--';
        estCell.style = 'padding: 6px 10px; text-align: center; font-weight:700; color:#1e3a8a;';
    }
};

window.quickUpdatePatientField = async function(id, field, value) {
    let updateObj = {};
    let updatedMetadata = {};

    // 1. Update local storage cache first
    try {
        let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        const locPat = localCache.find(p => p.id === id || p.cama === id);
        if (locPat) {
            locPat.metadata = locPat.metadata || {};
            if (field === 'nombre') locPat.nombre = value;
            else if (field === 'diagnostico') locPat.diagnostico = value;
            else if (field === 'edad') locPat.edad = value ? parseInt(value) : 0;
            else if (field === 'sexo') locPat.sexo = value;
            else if (field === 'peso_kg') {
                locPat.peso_kg = value ? parseFloat(value) : 0;
                const { meters } = window.parseSmartHeight(locPat.estatura_m || locPat.talla_cm);
                if (meters > 0 && locPat.peso_kg > 0) {
                    locPat.metadata.imc = parseFloat((locPat.peso_kg / (meters * meters)).toFixed(1));
                    locPat.metadata.estado_nutricional = window.computeNutritionalStatusAbbrev(locPat.metadata.imc, locPat.edad).abbrev;
                }
                if (typeof window.calculateTableIMC === 'function') window.calculateTableIMC(id);
            } else if (field === 'talla_cm' || field === 'estatura_m') {
                const { meters, cm } = window.parseSmartHeight(value);
                locPat.talla_cm = cm;
                locPat.estatura_m = meters;
                if (locPat.peso_kg && meters > 0) {
                    locPat.metadata.imc = parseFloat((locPat.peso_kg / (meters * meters)).toFixed(1));
                    locPat.metadata.estado_nutricional = window.computeNutritionalStatusAbbrev(locPat.metadata.imc, locPat.edad).abbrev;
                }
                if (typeof window.calculateTableIMC === 'function') window.calculateTableIMC(id);
            } else if (field === 'num_ficha') locPat.metadata.num_ficha = value;
            else if (field === 'patologia_dm') locPat.metadata.patologia_dm = !!value;
            else if (field === 'patologia_hta') locPat.metadata.patologia_hta = !!value;
            else if (field === 'patologia_erc') locPat.metadata.patologia_erc = !!value;
            else if (field === 'regimen') locPat.metadata.regimen = value;
            else if (field === 'obs_generales' || field === 'observaciones_generales') locPat.metadata.observaciones_generales = value;
            else if (field === 'riesgo_lpp') locPat.metadata.riesgo_lpp = value;
            else if (field === 'eval_tipo') locPat.metadata.eval_tipo = value;
            else if (field === 'fecha_ingreso_servicio') locPat.metadata.fecha_ingreso_servicio = value;

            localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
        }
    } catch(e) {}

    // 2. Update Supabase
    if (supabaseClient) {
        const { data: p } = await supabaseClient.from('pacientes').select('metadata, peso_kg, estatura_m, talla_cm').eq('id', id).single();
        if (p) {
            updatedMetadata = { ...(p.metadata || {}) };
            if (field === 'nombre') updateObj.nombre = value;
            else if (field === 'diagnostico') updateObj.diagnostico = value;
            else if (field === 'edad') updateObj.edad = value ? parseInt(value) : 0;
            else if (field === 'sexo') updateObj.sexo = value;
            else if (field === 'peso_kg') {
                const pKg = value ? parseFloat(value) : null;
                updateObj.peso_kg = pKg;
                const { meters } = window.parseSmartHeight(p.estatura_m || p.talla_cm);
                if (meters > 0 && pKg > 0) {
                    updatedMetadata.imc = parseFloat((pKg / (meters * meters)).toFixed(1));
                    updatedMetadata.estado_nutricional = window.computeNutritionalStatusAbbrev(updatedMetadata.imc, p.edad).abbrev;
                }
                updateObj.metadata = updatedMetadata;
            } else if (field === 'talla_cm' || field === 'estatura_m') {
                const { meters, cm } = window.parseSmartHeight(value);
                updateObj.talla_cm = cm || null;
                updateObj.estatura_m = meters || null;
                if (p.peso_kg && meters > 0) {
                    updatedMetadata.imc = parseFloat((p.peso_kg / (meters * meters)).toFixed(1));
                    updatedMetadata.estado_nutricional = window.computeNutritionalStatusAbbrev(updatedMetadata.imc, p.edad).abbrev;
                }
                updateObj.metadata = updatedMetadata;
            } else if (field === 'num_ficha') {
                updatedMetadata.num_ficha = value;
                updateObj.metadata = updatedMetadata;
            } else if (field === 'patologia_dm') {
                updatedMetadata.patologia_dm = !!value;
                updateObj.metadata = updatedMetadata;
            } else if (field === 'patologia_hta') {
                updatedMetadata.patologia_hta = !!value;
                updateObj.metadata = updatedMetadata;
            } else if (field === 'patologia_erc') {
                updatedMetadata.patologia_erc = !!value;
                updateObj.metadata = updatedMetadata;
            } else if (field === 'regimen') {
                updatedMetadata.regimen = value;
                updateObj.metadata = updatedMetadata;
            } else if (field === 'obs_generales' || field === 'observaciones_generales') {
                updatedMetadata.observaciones_generales = value;
                updateObj.metadata = updatedMetadata;
            } else if (field === 'riesgo_lpp') {
                updatedMetadata.riesgo_lpp = value;
                updateObj.metadata = updatedMetadata;
            } else if (field === 'eval_tipo') {
                updatedMetadata.eval_tipo = value;
                updateObj.metadata = updatedMetadata;
            } else if (field === 'fecha_ingreso_servicio') {
                updatedMetadata.fecha_ingreso_servicio = value;
                updateObj.metadata = updatedMetadata;
            }

            await supabaseClient.from('pacientes').update(updateObj).eq('id', id);
        }
    }

    // 3. Update DOM cells directly for IMC and EST NUT without re-rendering the whole table
    try {
        let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        const locPat = localCache.find(p => p.id === id || p.cama === id);
        if (locPat) {
            const hM = locPat.estatura_m || (locPat.talla_cm ? locPat.talla_cm / 100 : 0);
            const pKg = locPat.peso_kg || 0;
            const imcNum = (pKg > 0 && hM > 0) ? (pKg / (hM * hM)) : 0;
            const imcStr = imcNum > 0 ? imcNum.toFixed(1).replace('.', ',') : '--';

            let abbrevStatus = '--';
            let statusBgStyle = 'background:#dcfce7; color:#166534; font-weight:700;';

            if (imcNum > 0) {
                const isElderly = (locPat.edad || 0) >= 65;
                if (isElderly) {
                    if (imcNum < 23) {
                        abbrevStatus = 'BP';
                        statusBgStyle = 'background:#fee2e2; color:#991b1b; font-weight:800;';
                    } else if (imcNum < 28) {
                        abbrevStatus = 'N';
                        statusBgStyle = 'background:#dcfce7; color:#166534; font-weight:700;';
                    } else if (imcNum < 32) {
                        abbrevStatus = 'SP';
                        statusBgStyle = 'background:#fef3c7; color:#92400e; font-weight:700;';
                    } else {
                        abbrevStatus = 'OB';
                        statusBgStyle = 'background:#ffedd5; color:#c2410c; font-weight:700;';
                    }
                } else {
                    if (imcNum < 18.5) {
                        abbrevStatus = 'BP';
                        statusBgStyle = 'background:#fee2e2; color:#991b1b; font-weight:800;';
                    } else if (imcNum < 25) {
                        abbrevStatus = 'N';
                        statusBgStyle = 'background:#dcfce7; color:#166534; font-weight:700;';
                    } else if (imcNum < 30) {
                        abbrevStatus = 'SP';
                        statusBgStyle = 'background:#fef3c7; color:#92400e; font-weight:700;';
                    } else {
                        abbrevStatus = 'OB';
                        statusBgStyle = 'background:#ffedd5; color:#c2410c; font-weight:700;';
                    }
                }
            }

            const imcCell = document.getElementById('imcCell_' + id);
            const estNutCell = document.getElementById('estNutCell_' + id);
            if (imcCell) {
                imcCell.innerText = imcStr;
                imcCell.style.cssText = `padding: 6px 10px; text-align: center; ${statusBgStyle}`;
            }
            if (estNutCell) {
                estNutCell.innerText = abbrevStatus;
                estNutCell.style.cssText = `padding: 6px 10px; text-align: center; ${statusBgStyle}`;
            }
        }
    } catch(e) {}
};

window.initTableColumnResizing = function() {
    const table = document.querySelector('.clinical-census-table');
    if (!table) return;

    let savedWidths = {};
    try {
        savedWidths = JSON.parse(localStorage.getItem('ward_table_col_widths') || '{}');
    } catch(e) {}

    const headers = table.querySelectorAll('th');
    headers.forEach((th, idx) => {
        const colKey = `col_${idx}`;
        if (savedWidths[colKey]) {
            th.style.width = savedWidths[colKey] + 'px';
            const innerDiv = th.querySelector('.resizable-th');
            if (innerDiv) innerDiv.style.width = savedWidths[colKey] + 'px';
        }

        if (!th.querySelector('.th-resizer')) {
            const resizer = document.createElement('div');
            resizer.className = 'th-resizer';
            resizer.style.cssText = 'position:absolute; right:0; top:0; bottom:0; width:8px; cursor:col-resize; user-select:none; z-index:2;';
            th.style.position = 'relative';
            th.appendChild(resizer);

            let startX, startWidth;
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startX = e.pageX;
                startWidth = th.offsetWidth;

                const onMouseMove = (moveEvt) => {
                    const newWidth = Math.max(30, startWidth + (moveEvt.pageX - startX));
                    th.style.width = newWidth + 'px';
                    const inner = th.querySelector('.resizable-th');
                    if (inner) inner.style.width = newWidth + 'px';
                    savedWidths[colKey] = newWidth;
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    localStorage.setItem('ward_table_col_widths', JSON.stringify(savedWidths));
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }
    });
};

function getDefaultBeds(floor, serviceId) {
    if (!serviceId) return [];
    const cleanId = serviceId.toLowerCase();
    
    // 1. Neonatología (CB, UCI, TIM)
    if (cleanId === 'neonatologia_uci') {
        const list = [];
        for (let i = 1; i <= 9; i++) {
            list.push(`Cupo ${i}`);
        }
        return list;
    }
    if (cleanId === 'neonatologia_tim' || cleanId === 'neonatologia_cuidados_basicos') {
        const list = [];
        for (let i = 1; i <= 18; i++) {
            list.push(`Cupo ${i}`);
        }
        return list;
    }
    
    // 2. Urgencias
    if (cleanId === 'urgencias') {
        const list = [];
        for (let i = 1; i <= 25; i++) {
            list.push(`AR ${i}`);
        }
        return list;
    }
    
    // 3. UCI Adulto
    if (cleanId === 'uci_adulto') {
        const list = [];
        for (let i = 1; i <= 18; i++) {
            list.push(`UCI ${i}`);
        }
        return list;
    }
    
    // 4. TIM Adulto
    if (cleanId === 'tim_adulto') {
        const list = [];
        for (let i = 1; i <= 27; i++) {
            list.push(`TIM ${i}`);
        }
        return list;
    }
    
    // 5. Floor 3 Pediatric Services
    if (cleanId === 'uco') {
        const list = [];
        for (let i = 1; i <= 10; i++) {
            list.push(`UCO ${i}`);
        }
        return list;
    }
    if (cleanId === 'uciped') {
        const list = [];
        for (let i = 1; i <= 6; i++) {
            list.push(`UCIPED ${i}`);
        }
        return list;
    }
    if (cleanId === 'timped') {
        const list = [];
        for (let i = 1; i <= 10; i++) {
            list.push(`TIMPED ${i}`);
        }
        return list;
    }
    if (cleanId === 'oncologia_pediatrica') {
        const list = [];
        for (let i = 1; i <= 5; i++) {
            list.push(`ONCO ${i}`);
        }
        return list;
    }
    if (cleanId === 'pediatria_lactantes') {
        const list = [];
        for (let r = 301; r <= 314; r++) {
            list.push(`${r}-1`);
            list.push(`${r}-2`);
            if (r === 301 || r === 302 || r === 303) {
                list.push(`${r}-3`);
            }
        }
        return list;
    }
    if (cleanId === 'segunda_infancia') {
        const list = [];
        for (let r = 315; r <= 322; r++) {
            list.push(`${r}-1`);
            list.push(`${r}-2`);
            if (r === 315 || r === 316) {
                list.push(`${r}-3`);
            }
        }
        return list;
    }
    if (cleanId === 'cirugia_infantil') {
        const list = [];
        for (let r = 323; r <= 328; r++) {
            list.push(`${r}-1`);
            list.push(`${r}-2`);
        }
        return list;
    }
    
    // 6. Floor 4: ARO, Ginecologia, Puerperio, RN Ala A, RN Ala D
    if (cleanId === 'aro') {
        const list = [];
        for (let r = 401; r <= 412; r++) {
            list.push(`${r}-1`);
            list.push(`${r}-2`);
            if (r === 401 || r === 402) {
                list.push(`${r}-3`);
            }
        }
        return list;
    }
    if (cleanId === 'ginecologia') {
        const list = [];
        for (let r = 413; r <= 423; r++) {
            list.push(`${r}-1`);
            list.push(`${r}-2`);
            if (r === 413 || r === 414) {
                list.push(`${r}-3`);
            }
        }
        return list;
    }
    if (cleanId === 'puerperio') {
        const list = [];
        for (let r = 433; r <= 443; r++) {
            list.push(`${r}-1`);
            list.push(`${r}-2`);
            if (r === 433 || r === 434) {
                list.push(`${r}-3`);
            }
        }
        return list;
    }
    if (cleanId === 'rn_ala_a') {
        const list = [];
        for (let i = 1; i <= 9; i++) {
            list.push(`RN ${i}`);
        }
        return list;
    }
    if (cleanId === 'rn_ala_d') {
        const list = [];
        for (let i = 1; i <= 17; i++) {
            list.push(`RN ${i}`);
        }
        return list;
    }
    
    // 7. General Alas for floors 5, 6, 7 (with up to 3 beds per room)
    if (floor === 5 || floor === 6 || floor === 7) {
        let startRoom = 1;
        let endRoom = 5;
        if (floor === 5) {
            if (cleanId === 'ala_a') { startRoom = 501; endRoom = 513; }
            else if (cleanId === 'ala_b') { startRoom = 515; endRoom = 527; }
            else if (cleanId === 'ala_c') { startRoom = 528; endRoom = 541; }
            else if (cleanId === 'ala_d') { startRoom = 542; endRoom = 555; }
        } else if (floor === 6) {
            if (cleanId === 'ala_a') { startRoom = 601; endRoom = 614; }
            else if (cleanId === 'ala_b') { startRoom = 615; endRoom = 627; }
            else if (cleanId === 'ala_c') { startRoom = 628; endRoom = 641; }
            else if (cleanId === 'ala_d') { startRoom = 642; endRoom = 655; }
        } else if (floor === 7) {
            if (cleanId === 'ala_a') { startRoom = 701; endRoom = 714; }
            else if (cleanId === 'ala_b') { startRoom = 718; endRoom = 726; }
            else if (cleanId === 'ala_c') { startRoom = 728; endRoom = 740; }
            else if (cleanId === 'ala_d' || cleanId.includes('cardiologia')) {
                return [
                    '749CX_1', '749CX_2',
                    '750CX_1', '750CX_2',
                    '751CX_1', '751CX_2',
                    '752CX_1',
                    '753CX_1', '753CX_2',
                    '754CX_1', '754CX_2'
                ];
            }
        }
        
        const list = [];
        for (let r = startRoom; r <= endRoom; r++) {
            list.push(`${r}-1`);
            list.push(`${r}-2`);
            list.push(`${r}-3`);
        }
        return list;
    }
    
    // 8. Floor 8: Ala A, Ala B
    if (floor === 8) {
        let startRoom = 801;
        let endRoom = 810;
        if (cleanId === 'ala_b') { startRoom = 811; endRoom = 815; }
        
        const list = [];
        for (let r = startRoom; r <= endRoom; r++) {
            list.push(`${r}-1`);
            list.push(`${r}-2`);
        }
        return list;
    }
    
    // Fallback default bed list
    const list = [];
    for (let r = 1; r <= 5; r++) {
        const roomNum = floor * 100 + r;
        list.push(`${roomNum}-1`);
        list.push(`${roomNum}-2`);
    }
    return list;
}

window.toggleRoomCollapse = function(roomKey, elementId) {
    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) return;
    const activeLoc = JSON.parse(activeLocStr);
    const locationKey = `HRA-${activeLoc.floor}-${activeLoc.serviceId}`;
    
    const storageKey = `collapsedRooms_${locationKey}`;
    let collapsed = [];
    try {
        collapsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch(e) {
        collapsed = [];
    }
    
    const index = collapsed.indexOf(roomKey);
    const element = document.getElementById(elementId);
    
    if (index >= 0) {
        collapsed.splice(index, 1);
        if (element) element.classList.remove('collapsed');
    } else {
        collapsed.push(roomKey);
        if (element) element.classList.add('collapsed');
    }
    
    localStorage.setItem(storageKey, JSON.stringify(collapsed));

    const viewMode = localStorage.getItem('wardViewMode') || 'grid';
    if (viewMode === 'table') {
        window.renderWardBedsGrid();
    }
};

window.scrollToFloatingPatients = function() {
    const activeLocStr = localStorage.getItem('activeLocation');
    const activeLoc = activeLocStr ? JSON.parse(activeLocStr) : { floor: 7, serviceId: 'ala_d' };
    const locationKey = `HRA-${activeLoc.floor}-${activeLoc.serviceId}`;
    const storageKey = `collapsedRooms_${locationKey}`;
    
    let collapsed = [];
    try {
        collapsed = JSON.parse(localStorage.getItem(storageKey) || '["PACIENTES QUE YA NO ESTÁN EN EL SERVICIO"]');
    } catch(e) {
        collapsed = ['PACIENTES QUE YA NO ESTÁN EN EL SERVICIO'];
    }

    const elementId = `room-group-floating`;
    const element = document.getElementById(elementId);

    ['PACIENTES QUE YA NO ESTÁN EN EL SERVICIO', 'Pacientes sin Cama'].forEach(k => {
        const idx = collapsed.indexOf(k);
        if (idx >= 0) collapsed.splice(idx, 1);
    });
    localStorage.setItem(storageKey, JSON.stringify(collapsed));
    if (element) element.classList.remove('collapsed');

    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.dischargeAllFloatingPatients = async function(skipConfirm = false) {
    const activeLocStr = localStorage.getItem('activeLocation');
    const activeLoc = activeLocStr ? JSON.parse(activeLocStr) : { floor: 7, serviceId: 'ala_d', serviceName: 'Ala D' };
    const locationKey = `HRA-${activeLoc.floor}-${activeLoc.serviceId}`;

    let bedsList = getDefaultBeds(activeLoc.floor, activeLoc.serviceId);
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data: configRecord } = await supabaseClient
            .from('config_camas')
            .select('beds')
            .eq('location_key', locationKey)
            .maybeSingle();
        if (configRecord && configRecord.beds) {
            bedsList = configRecord.beds;
        }
    }

    let activePatients = [];
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data: patients } = await supabaseClient
            .from('pacientes')
            .select('*')
            .order('created_at', { ascending: false });
        if (patients) {
            activePatients = patients.filter(p => p.estado_sala !== 'de_alta' && p.estado_sala !== 'eliminado');
        }
    }

    try {
        const localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        localCache.forEach(lp => {
            if (!lp || lp.estado_sala === 'de_alta') return;
            const idx = activePatients.findIndex(ap => (ap.id === lp.id) || (ap.cama && lp.cama && ap.cama.trim().toUpperCase() === lp.cama.trim().toUpperCase()));
            if (idx >= 0) {
                const realDbId = activePatients[idx].id;
                activePatients[idx] = {
                    ...activePatients[idx],
                    ...lp,
                    id: (realDbId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realDbId)) ? realDbId : (lp.id || realDbId)
                };
            } else {
                activePatients.push(lp);
            }
        });
    } catch(e) {}

    const matchedPatients = activePatients.filter(p => {
        const cleanPBed = p.cama ? p.cama.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
        const isBedInService = bedsList.some(b => b.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanPBed || b === p.cama);
        if (p.metadata && p.metadata.location && p.metadata.location.serviceId) {
            const locFloor = p.metadata.location.floor;
            if (locFloor && activeLoc.floor && String(locFloor) !== String(activeLoc.floor)) {
                return isBedInService;
            }
            return p.metadata.location.serviceId === activeLoc.serviceId || isBedInService;
        }
        return isBedInService;
    });

    const floating = matchedPatients.filter(p => !bedsList.includes(p.cama));
    if (floating.length === 0) {
        if (!skipConfirm) showToast("ℹ️ No hay pacientes fuera de servicio para dar de alta.");
        return;
    }

    if (!skipConfirm && !confirm(`¿Dar de alta masiva a los ${floating.length} paciente(s) que ya no están en este servicio?\n(Quedarán guardados en el historial del censo).`)) {
        return;
    }

    showToast("⏳ Dando de alta masiva...");

    const dbIdsToDischarge = floating.map(p => p.id).filter(id => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

    // BULK UPDATE IN SUPABASE (Ultra fast)
    if (dbIdsToDischarge.length > 0 && typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { error } = await supabaseClient
            .from('pacientes')
            .update({ estado_sala: 'de_alta' })
            .in('id', dbIdsToDischarge);
            
        if (error) console.warn("Bulk discharge error:", error.message);
    }

    try {
        let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        localCache = localCache.filter(item => item && !floating.some(f => f.id === item.id || f.cama === item.cama));
        localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
    } catch(e) {}

    showToast(`🧹 ¡Se dieron de alta ${floating.length} pacientes en 1 segundo!`);
    await window.renderWardBedsGrid();
};

window.onAgeInputChanged = function() {
    const ageInput = document.getElementById('edad');
    if (!ageInput) return;
    const ageVal = parseFloat(ageInput.value);
    if (isNaN(ageVal)) return;

    const hydRadios = document.getElementsByName('hydMethod');
    if (hydRadios && hydRadios.length > 0) {
        if (ageVal >= 18) {
            for (let r of hydRadios) {
                if (r.value === 'mlkg') r.checked = true;
            }
        } else {
            for (let r of hydRadios) {
                if (r.value === 'holiday') r.checked = true;
            }
        }
        if (typeof window.toggleHydMethod === 'function') {
            window.toggleHydMethod();
        }
    }
    if (typeof window.updateModulesCalculatorVisibility === 'function') {
        window.updateModulesCalculatorVisibility();
    }
};

window.updateModulesCalculatorVisibility = function() {
    const modulesSection = document.getElementById('modulesCardSection') || document.getElementById('modulesAccordion')?.closest('section');
    if (!modulesSection) return;

    let isPedsOrNeo = false;

    // 1. Check active location floor / serviceId
    const activeLocStr = localStorage.getItem('activeLocation');
    if (activeLocStr) {
        try {
            const activeLoc = JSON.parse(activeLocStr);
            const serviceId = (activeLoc.serviceId || '').toLowerCase();
            const floor = parseInt(activeLoc.floor);

            if (floor === 3 || 
                serviceId.includes('ped') || 
                serviceId.includes('neo') || 
                serviceId.includes('uci_ped') || 
                serviceId.includes('timped') || 
                serviceId.includes('onco') || 
                serviceId.includes('rn_') || 
                serviceId.includes('lactante') || 
                serviceId.includes('infancia') || 
                serviceId.includes('infantil')) {
                isPedsOrNeo = true;
            }
        } catch(e) {}
    }

    // 2. Check loaded patient age
    const ageInput = document.getElementById('edad');
    if (ageInput && ageInput.value !== '') {
        const ageVal = parseFloat(ageInput.value);
        if (!isNaN(ageVal)) {
            if (ageVal < 18) {
                isPedsOrNeo = true;
            }
        }
    }

    // 3. Check pediatric Z-score or neonate panel visibility
    const rowPediatric = document.getElementById('rowPediatric');
    const rowNeonate = document.getElementById('rowNeonate');
    if ((rowPediatric && rowPediatric.style.display !== 'none') || (rowNeonate && rowNeonate.style.display !== 'none')) {
        isPedsOrNeo = true;
    }

    modulesSection.style.display = isPedsOrNeo ? 'block' : 'none';
};

window.toggleColumnVisibilityMenu = function(evt) {
    if (evt && evt.stopPropagation) evt.stopPropagation();
    let menu = document.getElementById('tableColumnMenu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'tableColumnMenu';
        menu.style.cssText = 'position:fixed; z-index:99999; background:white; border:1px solid #cbd5e1; border-radius:10px; padding:12px; box-shadow:0 10px 25px rgba(0,0,0,0.2); display:flex; flex-direction:column; gap:8px; width:220px; font-size:0.8rem; font-family:sans-serif;';
        
        const cols = [
            { key: 'col-ficha', label: 'Ficha / RUT' },
            { key: 'col-edad', label: 'Edad y Sexo' },
            { key: 'col-patologia', label: 'DM / HTA / ERC' },
            { key: 'col-obs', label: 'Observaciones' },
            { key: 'col-antropo', label: 'Peso / Talla' },
            { key: 'col-imc', label: 'IMC y Clasificación' },
            { key: 'col-nrs', label: 'NRS / Score' },
            { key: 'col-lpp', label: 'Riesgo LPP' }
        ];

        let html = '<div style="font-weight:800; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;"><span>👁️ Mostrar Columnas</span><span onclick="document.getElementById(\'tableColumnMenu\').style.display=\'none\'" style="cursor:pointer; font-weight:bold;">✖</span></div>';
        
        const hiddenCols = JSON.parse(localStorage.getItem('hiddenTableCols') || '[]');

        cols.forEach(c => {
            const isChecked = !hiddenCols.includes(c.key);
            html += `
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#334155; user-select:none;">
                    <input type="checkbox" data-col="${c.key}" ${isChecked ? 'checked' : ''} onchange="window.onColumnVisibilityToggle('${c.key}', this.checked)">
                    ${c.label}
                </label>
            `;
        });

        menu.innerHTML = html;
        document.body.appendChild(menu);
    }

    const btn = evt ? evt.currentTarget : document.getElementById('btnToggleTableCols');
    if (btn) {
        const rect = btn.getBoundingClientRect();
        menu.style.top = (rect.bottom + 6) + 'px';
        menu.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
    }
    menu.style.display = menu.style.display === 'none' || !menu.style.display ? 'flex' : 'none';
};

window.onColumnVisibilityToggle = function(colKey, isVisible) {
    let hiddenCols = JSON.parse(localStorage.getItem('hiddenTableCols') || '[]');
    if (isVisible) {
        hiddenCols = hiddenCols.filter(k => k !== colKey);
    } else {
        if (!hiddenCols.includes(colKey)) hiddenCols.push(colKey);
    }
    localStorage.setItem('hiddenTableCols', JSON.stringify(hiddenCols));
    window.applyColumnVisibilityStyles();
};

window.applyColumnVisibilityStyles = function() {
    let hiddenCols = JSON.parse(localStorage.getItem('hiddenTableCols') || '[]');
    let styleTag = document.getElementById('dynamicTableColumnStyles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamicTableColumnStyles';
        document.head.appendChild(styleTag);
    }

    let css = '';
    hiddenCols.forEach(k => {
        css += `.clinical-census-table .${k} { display: none !important; }\n`;
    });
    styleTag.textContent = css;
};

// --- TOGGLE EVAL STATUS (VI / VGO) MANUAL & AUTOMATIC HANDLER ---
window.togglePatientEvalStatus = async function(patientId, evalType, event) {
    if (event) event.stopPropagation();

    let localCache = [];
    try {
        localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
    } catch (e) {
        localCache = [];
    }

    let p = localCache.find(x => String(x.id) === String(patientId));

    if (!p && AppState.patient && String(AppState.patient.id) === String(patientId)) {
        p = AppState.patient;
    }

    if (!p && typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data: dbP } = await supabaseClient.from('pacientes').select('*').eq('id', patientId).maybeSingle();
            if (dbP) p = dbP;
        } catch(e) {}
    }

    if (!p) {
        alert("No se pudo localizar el paciente seleccionado.");
        return;
    }

    p.metadata = p.metadata || {};
    const nowIso = new Date().toISOString();

    let isViActive = false;
    let isVgoActive = false;

    if (evalType === 'vi') {
        const currentVal = Boolean(p.metadata.has_vi);
        p.metadata.has_vi = !currentVal;
        isViActive = p.metadata.has_vi;
        isVgoActive = Boolean(p.metadata.has_vgo);
        if (!currentVal) {
            p.metadata.fecha_vi = nowIso;
            p.metadata.fecha_evaluacion = nowIso;
            p.evaluado = true;
        } else {
            delete p.metadata.fecha_vi;
            if (!p.metadata.has_vgo) {
                p.evaluado = false;
            }
        }
    } else if (evalType === 'vgo') {
        const currentVal = Boolean(p.metadata.has_vgo);
        p.metadata.has_vgo = !currentVal;
        isVgoActive = p.metadata.has_vgo;
        isViActive = Boolean(p.metadata.has_vi);
        if (!currentVal) {
            p.metadata.has_vgo = true;
            isVgoActive = true;
            p.metadata.fecha_vgo = nowIso;
            p.metadata.fecha_evaluacion = nowIso;
            p.evaluado = true;
        } else {
            delete p.metadata.fecha_vgo;
            if (!p.metadata.has_vi) {
                p.evaluado = false;
            }
        }
    }

    // 1. Instant Optimistic DOM Update on the clicked button (Zero latency, smooth 60fps)
    const btn = event?.currentTarget;
    if (btn) {
        if (evalType === 'vi') {
            btn.innerHTML = isViActive ? '✓ VI' : '○ VI';
            btn.style.background = isViActive ? '#10b981' : '#f1f5f9';
            btn.style.color = isViActive ? 'white' : '#64748b';
            btn.style.border = isViActive ? '1px solid #059669' : '1px solid #cbd5e1';
        } else if (evalType === 'vgo') {
            btn.innerHTML = isVgoActive ? '✓ VGO' : '○ VGO';
            btn.style.background = isVgoActive ? '#3b82f6' : '#f1f5f9';
            btn.style.color = isVgoActive ? 'white' : '#64748b';
            btn.style.border = isVgoActive ? '1px solid #2563eb' : '1px solid #cbd5e1';
        }

        // If newly evaluated today, hide the ⚠️ reeval tag immediately next to the button
        if ((evalType === 'vi' && isViActive) || (evalType === 'vgo' && isVgoActive)) {
            const container = btn.parentElement;
            if (container) {
                const reevalBadge = container.querySelector('.badge-reeval');
                if (reevalBadge) reevalBadge.style.display = 'none';
            }
        }
    }

    // 2. Update local cache
    const cacheIdx = localCache.findIndex(x => String(x.id) === String(patientId));
    if (cacheIdx >= 0) {
        localCache[cacheIdx] = { ...localCache[cacheIdx], ...p, metadata: p.metadata, evaluado: p.evaluado };
    } else {
        localCache.push(p);
    }
    localStorage.setItem('local_ward_patients', JSON.stringify(localCache));

    if (AppState.patient && String(AppState.patient.id) === String(patientId)) {
        AppState.patient.metadata = p.metadata;
        AppState.patient.evaluado = p.evaluado;
    }

    // 3. Sync to Supabase in background asynchronously (fire-and-forget, non-blocking)
    if (typeof supabaseClient !== 'undefined' && supabaseClient && !String(patientId).startsWith('pat_')) {
        supabaseClient.from('pacientes').update({
            evaluado: p.evaluado,
            metadata: p.metadata,
            updated_at: new Date()
        }).eq('id', patientId).then(() => {}).catch(e => {
            console.warn("Error updating eval status in Supabase:", e);
        });
    }

    // 4. Update view silently in background so the table never blanks or closes
    if (typeof window.renderWardBedsGrid === 'function') {
        window.renderWardBedsGrid(true);
    }
};

window.renderWardBedsGrid = async function(silent = false) {
    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) return;
    const activeLoc = JSON.parse(activeLocStr);
    
    const grid = document.getElementById('wardBedsGrid');
    if (!grid) return;

    // Preserve scroll positions to prevent jumping
    const scrollY = window.scrollY;
    const prevScrollDiv = grid.querySelector('div[style*="overflow-x"]');
    const scrollX = prevScrollDiv ? prevScrollDiv.scrollLeft : 0;
    
    // Only show "Cargando..." on cold initial load when grid is completely empty
    const hasExistingContent = grid.children.length > 0 && !grid.innerHTML.includes('Cargando salas');
    if (!silent && !hasExistingContent) {
        grid.innerHTML = '<p style="opacity:0.5; text-align:center; padding: 40px;">Cargando salas y camas...</p>';
    }
    
    // Check if admin is logged in to show bed tools
    const userEmail = AppState.user?.email || '';
    const isAdmin = userEmail === 'martingonza2010@gmail.com';
    const adminControls = document.getElementById('adminBedControlRow');
    if (adminControls) {
        adminControls.style.display = isAdmin ? 'flex' : 'none';
    }
    
    try {
        const locationKey = `HRA-${activeLoc.floor}-${activeLoc.serviceId}`;
        
        // 1. Fetch customized beds config
        let bedsList = getDefaultBeds(activeLoc.floor, activeLoc.serviceId);
        if (supabaseClient) {
            const { data: configRecord } = await supabaseClient
                .from('config_camas')
                .select('*')
                .eq('location_key', locationKey)
                .maybeSingle();
                
            if (configRecord && configRecord.beds) {
                if (activeLoc.floor === 7 && (activeLoc.serviceId === 'ala_d' || activeLoc.serviceId.includes('cardiologia')) && configRecord.beds.some(b => b.startsWith('742'))) {
                    bedsList = getDefaultBeds(7, 'ala_d');
                    await supabaseClient.from('config_camas').update({ beds: bedsList, updated_at: new Date() }).eq('id', configRecord.id);
                } else {
                    bedsList = configRecord.beds;
                }
            }
        }
        
        // 2. Fetch active patients from DB
        let activePatients = [];
        let isDbConnected = false;
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data: patients, error } = await supabaseClient
                .from('pacientes')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (!error && patients) {
                activePatients = patients.filter(p => p.estado_sala !== 'de_alta' && p.estado_sala !== 'eliminado');
                isDbConnected = true;
            }
        }

        // Merge local storage cache patients safely
        try {
            const localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
            localCache.forEach(lp => {
                if (!lp || lp.estado_sala === 'de_alta' || lp.estado_sala === 'eliminado') return;
                
                const idx = activePatients.findIndex(ap => {
                    if (ap.id === lp.id) return true;
                    if (ap.cama && lp.cama && ap.cama.trim().toUpperCase() === lp.cama.trim().toUpperCase()) {
                        const apSrv = ap.metadata?.location?.serviceId;
                        const lpSrv = lp.metadata?.location?.serviceId;
                        if (apSrv && lpSrv) return apSrv === lpSrv;
                        return true;
                    }
                    return false;
                });
                if (idx >= 0) {
                    const realDbId = activePatients[idx].id;
                    activePatients[idx] = {
                        ...activePatients[idx],
                        ...lp,
                        id: (realDbId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realDbId)) ? realDbId : (lp.id || realDbId),
                        metadata: {
                            ...(activePatients[idx].metadata || {}),
                            ...(lp.metadata || {})
                        }
                    };
                } else if (!isDbConnected || (lp.id && lp.id.startsWith('pat_'))) {
                    // Only add local cache items if DB is offline OR if they are unsynced local drafts (pat_...)
                    activePatients.push(lp);
                }
            });
        } catch(e) {
            console.error("Error merging local ward patients:", e);
        }
        
        // Filter patients matched to this service (strict service isolation)
        const matchedPatients = activePatients.filter(p => {
            const cleanPBed = p.cama ? p.cama.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
            const isBedInService = bedsList.some(b => b.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanPBed || b === p.cama);

            if (p.metadata && p.metadata.location && p.metadata.location.serviceId) {
                const locFloor = p.metadata.location.floor;
                if (locFloor && activeLoc.floor && String(locFloor) !== String(activeLoc.floor)) {
                    return false;
                }
                return p.metadata.location.serviceId === activeLoc.serviceId;
            }
            return isBedInService;
        });
        
        // 2b. Compute clinical evaluation statuses (VI, VGO, 7-day reevaluation check)
        const evalFilterSelect = document.getElementById('wardEvalFilterSelect');
        const evalFilter = evalFilterSelect ? evalFilterSelect.value : 'all';
        let reevalCount = 0;
        const now = new Date();

        matchedPatients.forEach(p => {
            const hasVI = !!(p.has_vi || p.metadata?.has_vi);
            const hasVGO = !!(p.has_vgo || p.metadata?.has_vgo);

            // Determine latest evaluation date
            const lastEvalDateStr = p.fecha_vgo || p.metadata?.fecha_vgo || p.fecha_vi || p.metadata?.fecha_vi || p.metadata?.fecha_evaluacion || p.created_at;
            let daysElapsed = 0;
            if (lastEvalDateStr) {
                const evalD = new Date(lastEvalDateStr);
                if (!isNaN(evalD.getTime())) {
                    const diffTime = Math.max(0, now.getTime() - evalD.getTime());
                    daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                }
            }

            const needsReeval = daysElapsed >= 7;
            if (needsReeval) {
                reevalCount++;
            }

            p._hasVI = hasVI;
            p._hasVGO = hasVGO;
            p._daysElapsed = daysElapsed;
            p._needsReeval = needsReeval;

            let matches = true;
            if (evalFilter === 'reeval') {
                matches = needsReeval;
            } else if (evalFilter === 'none') {
                matches = !hasVI && !hasVGO;
            } else if (evalFilter === 'vi_only') {
                matches = hasVI && !hasVGO;
            } else if (evalFilter === 'vi_and_vgo') {
                matches = hasVI && hasVGO;
            }
            p._matchesEvalFilter = matches;
        });

        // Update reevaluation counter badge in header
        const reevalBadge = document.getElementById('wardReevalCountBadge');
        if (reevalBadge) {
            if (reevalCount > 0) {
                reevalBadge.style.display = 'inline-block';
                reevalBadge.textContent = `⚠️ ${reevalCount} por reevaluar`;
            } else {
                reevalBadge.style.display = 'none';
            }
        }

        // Helper function to render interactive evaluation pills [VI] [VGO] and Reeval badge
        const getEvalPillsHTML = (p, isCompact = false) => {
            if (!p) return '';
            const viActive = !!p._hasVI;
            const vgoActive = !!p._hasVGO;
            const needsReeval = !!p._needsReeval;
            const days = p._daysElapsed || 0;

            const viStyle = viActive 
                ? 'background:#10b981; color:white; border:1px solid #059669;' 
                : 'background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1;';
            const vgoStyle = vgoActive 
                ? 'background:#3b82f6; color:white; border:1px solid #2563eb;' 
                : 'background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1;';

            const reevalHTML = needsReeval 
                ? `<span class="badge-reeval" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-size:${isCompact ? '0.62rem' : '0.68rem'}; font-weight:800; padding:1px 5px; border-radius:4px; white-space:nowrap; display:inline-block;" title="Han transcurrido ${days} días desde su última evaluación. ¡Requiere reevaluación!">⚠️ ${days}d</span>` 
                : '';

            return `
                <div style="display:flex; align-items:center; justify-content:${isCompact ? 'center' : 'flex-end'}; gap:4px; flex-wrap:wrap;">
                    <button onclick="event.stopPropagation(); window.togglePatientEvalStatus('${p.id}', 'vi', event);" style="${viStyle} padding:1px 5px; border-radius:4px; font-size:${isCompact ? '0.65rem' : '0.7rem'}; font-weight:800; cursor:pointer; transition:all 0.15s;" title="Valoración de Ingreso (VI) - Clic para alternar">${viActive ? '✓ VI' : '○ VI'}</button>
                    <button onclick="event.stopPropagation(); window.togglePatientEvalStatus('${p.id}', 'vgo', event);" style="${vgoStyle} padding:1px 5px; border-radius:4px; font-size:${isCompact ? '0.65rem' : '0.7rem'}; font-weight:800; cursor:pointer; transition:all 0.15s;" title="Valoración Global Objetiva (VGO) - Clic para alternar">${vgoActive ? '✓ VGO' : '○ VGO'}</button>
                    ${reevalHTML}
                </div>
            `;
        };
        
        // 3. Group beds by room
        const groupOrder = [];
        const groupedBeds = {};
        bedsList.forEach(bedName => {
            let groupKey = 'Cupos del Servicio';
            if (bedName.includes('-')) {
                const parts = bedName.split('-');
                groupKey = `Sala ${parts[0].trim()}`;
            }
            if (!groupedBeds[groupKey]) {
                groupedBeds[groupKey] = [];
                groupOrder.push(groupKey);
            }
            groupedBeds[groupKey].push(bedName);
        });

        // Get collapsed rooms for this service (default Pacientes sin Cama to collapsed)
        const storageKey = `collapsedRooms_${locationKey}`;
        let collapsedRooms = [];
        try {
            const rawStored = localStorage.getItem(storageKey);
            if (rawStored === null) {
                collapsedRooms = ['PACIENTES QUE YA NO ESTÁN EN EL SERVICIO', 'Pacientes sin Cama'];
                localStorage.setItem(storageKey, JSON.stringify(collapsedRooms));
            } else {
                collapsedRooms = JSON.parse(rawStored);
            }
        } catch(e) {
            collapsedRooms = ['PACIENTES QUE YA NO ESTÁN EN EL SERVICIO', 'Pacientes sin Cama'];
        }

        const viewMode = localStorage.getItem('wardViewMode') || 'grid';
        const selectMode = document.getElementById('wardViewModeSelect');
        if (selectMode) selectMode.value = viewMode;

        let floatingPatients = matchedPatients.filter(p => !bedsList.includes(p.cama));

        window.applyColumnVisibilityStyles();
        if (typeof window.updateModulesCalculatorVisibility === 'function') {
            window.updateModulesCalculatorVisibility();
        }

        // Render top transit alert banner
        let transitAlertContainer = document.getElementById('wardTransitAlertContainer');
        if (!transitAlertContainer && grid.parentNode) {
            transitAlertContainer = document.createElement('div');
            transitAlertContainer.id = 'wardTransitAlertContainer';
            grid.parentNode.insertBefore(transitAlertContainer, grid);
        }
        if (transitAlertContainer) {
            if (floatingPatients.length > 0) {
                transitAlertContainer.style.display = 'block';
                transitAlertContainer.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; background:#fff1f2; border:1px solid #fecdd3; border-radius:10px; padding:10px 14px; margin-top:12px; margin-bottom:12px; font-size:0.8rem; color:#be123c; flex-wrap:wrap; gap:8px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">
                        <div style="display:flex; align-items:center; gap:8px; font-weight:700;">
                            <span>⚠️ Se detectaron ${floatingPatients.length} paciente(s) que ya no están en cama (fuera de servicio).</span>
                            <button class="btn-micro" onclick="window.scrollToFloatingPatients()" style="background:#be123c; color:white; border:none; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;" title="Ver pacientes fuera de servicio">👇 Ver Pacientes</button>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button id="btnToggleTableCols" onclick="window.toggleColumnVisibilityMenu(event)" style="background:#475569; color:white; border:none; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;" title="Personalizar columnas visibles en la vista de tabla">👁️ Columnas</button>
                            <button onclick="window.dischargeAllFloatingPatients()" style="background:#881337; color:white; border:none; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;" title="Dar de alta a todos los pacientes fuera de servicio">🧹 Dar de alta a todos (${floatingPatients.length})</button>
                        </div>
                    </div>
                `;
            } else {
                transitAlertContainer.style.display = 'block';
                transitAlertContainer.innerHTML = `
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px; margin-bottom:8px;">
                        <button id="btnToggleTableCols" onclick="window.toggleColumnVisibilityMenu(event)" style="background:#475569; color:white; border:none; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;" title="Personalizar columnas visibles en la vista de tabla">👁️ Columnas Visibles</button>
                    </div>
                `;
            }
        }

        if (viewMode === 'table') {
            grid.style.display = 'block';
            grid.style.width = '100%';
            let tableHTML = `
                <div style="overflow-x: auto; width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-top: 15px;">
                    <table class="clinical-census-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.75rem; font-family: sans-serif; min-width: 1400px; line-height: 1.2;">
                        <thead style="background: #f1f5f9; position: sticky; top: 0; z-index: 10;">
                            <tr style="border-bottom: 2px solid #cbd5e1; height: 38px; background: #e2e8f0;">
                                <th class="col-cama" style="color: #1e293b; font-weight: 800; width: 85px; padding: 0;"><div class="resizable-th" style="width: 85px;">CAMA</div></th>
                                <th class="col-ficha" style="color: #1e293b; font-weight: 800; width: 100px; padding: 0;"><div class="resizable-th" style="width: 100px;">FICHA/RUT</div></th>
                                <th class="col-nombre" style="color: #1e293b; font-weight: 800; width: 220px; padding: 0;"><div class="resizable-th" style="width: 220px;">NOMBRE</div></th>
                                <th class="col-edad" style="color: #1e293b; font-weight: 800; width: 45px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 45px;">EDAD</div></th>
                                <th class="col-dx" style="color: #1e293b; font-weight: 800; width: 220px; padding: 0;"><div class="resizable-th" style="width: 220px;">DIAGNÓSTICO</div></th>
                                <th class="col-patologia" style="color: #1e293b; font-weight: 800; width: 35px; text-align: center; background:#edf2f7; border-left:1px solid #cbd5e1; border-right:1px solid #cbd5e1; padding: 0;"><div class="resizable-th" style="width: 35px;">DM</div></th>
                                <th class="col-patologia" style="color: #1e293b; font-weight: 800; width: 35px; text-align: center; background:#edf2f7; border-right:1px solid #cbd5e1; padding: 0;"><div class="resizable-th" style="width: 35px;">HTA</div></th>
                                <th class="col-patologia" style="color: #1e293b; font-weight: 800; width: 35px; text-align: center; background:#edf2f7; border-right:1px solid #cbd5e1; padding: 0;"><div class="resizable-th" style="width: 35px;">ERC</div></th>
                                <th class="col-dieta" style="color: #1e293b; font-weight: 800; width: 140px; padding: 0;"><div class="resizable-th" style="width: 140px;">DIETOTERAPIA</div></th>
                                <th class="col-obs" style="color: #1e293b; font-weight: 800; width: 260px; padding: 0;"><div class="resizable-th" style="width: 260px;">OBSERVACIONES GENERALES</div></th>
                                <th class="col-antropo" style="color: #1e293b; font-weight: 800; width: 70px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 70px;">PESO</div></th>
                                <th class="col-antropo" style="color: #1e293b; font-weight: 800; width: 60px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 60px;">TALLA</div></th>
                                <th class="col-imc" style="color: #1e293b; font-weight: 800; width: 55px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 55px;">IMC</div></th>
                                <th class="col-imc" style="color: #1e293b; font-weight: 800; width: 75px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 75px;">EST NUT</div></th>
                                <th class="col-nrs" style="color: #1e293b; font-weight: 800; width: 50px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 50px;">SCRG</div></th>
                                <th class="col-lpp" style="color: #1e293b; font-weight: 800; width: 80px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 80px;">RIESGO LPP</div></th>
                                <th class="col-eval" style="color: #1e293b; font-weight: 800; width: 130px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 130px;">VI / VGO</div></th>
                                <th class="col-edad" style="color: #1e293b; font-weight: 800; width: 45px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 45px;">SEXO</div></th>
                                <th class="col-eval" style="color: #1e293b; font-weight: 800; width: 95px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 95px;">FECHA INGR</div></th>
                                <th style="color: #1e293b; font-weight: 800; width: 110px; text-align: center; padding: 0;"><div class="resizable-th" style="width: 110px;">ACCIONES</div></th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            groupOrder.forEach((roomName, roomIndex) => {
                const bedsInRoom = groupedBeds[roomName];
                const matchingInRoom = bedsInRoom.filter(b => {
                    const p = matchedPatients.find(pat => pat.cama === b);
                    return p && (evalFilter === 'all' || p._matchesEvalFilter);
                }).length;
                if (evalFilter !== 'all' && matchingInRoom === 0) return;

                const occupiedInRoom = bedsInRoom.filter(b => matchedPatients.some(p => p.cama === b)).length;
                
                tableHTML += `
                    <tr class="room-header-row ${occupiedInRoom === 0 ? 'empty-room-row' : ''}" style="background: #f8fafc; font-weight: 800; color: #1e3a8a; border-top: 2px solid #cbd5e1; height: 32px;">
                        <td colspan="20" style="padding: 8px 10px; font-size: 0.8rem; border-bottom: 1px solid #cbd5e1; text-transform: uppercase;">
                            🏢 ${roomName === 'Cupos del Servicio' ? 'Área / Cupos del Servicio' : roomName}
                        </td>
                    </tr>
                `;

                bedsInRoom.forEach(bedName => {
                    const patient = matchedPatients.find(p => p.cama === bedName);
                    
                    if (evalFilter !== 'all' && (!patient || !patient._matchesEvalFilter)) {
                        return;
                    }

                    if (patient) {
                        const isCritico = patient.estado_sala === 'critico' || patient.requiere_atencion;
                        const rowStyle = isCritico ? 'background: #fff5f5; border-bottom: 1px solid #fecaca;' : 'border-bottom: 1px solid #e2e8f0;';
                        
                        const numFicha = patient.metadata?.num_ficha || '';
                        
                        // Parse history entries for Observaciones Generales (Colaborativo entre colegas)
                        const allHistoryForName = activePatients.filter(ap => ap.nombre === patient.nombre);
                        allHistoryForName.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        
                        const obsEntries = [];
                        allHistoryForName.forEach(h => {
                            const d = new Date(h.created_at);
                            const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                            let parts = [];
                            
                            const examsList = h.metadata?.assessment?.exams || [];
                            if (examsList.length > 0) {
                                const examsStr = examsList.map(e => `${e.type} ${e.res}`).join(' - ');
                                parts.push(examsStr);
                            }
                            if (h.metadata?.antecedentes_morbidos && parts.length === 0) {
                                parts.push(h.metadata.antecedentes_morbidos);
                            }
                            if (parts.length > 0) {
                                obsEntries.push(`${dateLabel}: ${parts.join(' - ')}`);
                            }
                        });
                        const customObs = patient.metadata?.observaciones_generales || '';
                        let obsGeneralesText = obsEntries.slice(0, 3).join(' | ') || 'Sin registros';
                        if (customObs) {
                            obsGeneralesText = `<b>${customObs}</b>` + (obsGeneralesText !== 'Sin registros' ? ` | ${obsGeneralesText}` : '');
                        }

                        // Age format
                        const ageStr = patient.edad || '--';
                        
                        // Height in meters & cm
                        const { meters: heightInMeters, cm: heightInCm } = window.parseSmartHeight(patient.estatura_m || patient.talla_cm);
                        const tallaDisplay = heightInMeters > 0 ? heightInMeters.toFixed(2).replace('.', ',') : '';

                        // BMI & status
                        const imcNum = patient.peso_kg > 0 && heightInMeters > 0 ? (patient.peso_kg / (heightInMeters * heightInMeters)) : 0;
                        const imcStr = imcNum > 0 ? imcNum.toFixed(1).replace('.', ',') : '--';

                        let abbrevStatus = '--';
                        let statusBgStyle = 'background:#dcfce7; color:#166534; font-weight:700;';

                        if (imcNum > 0) {
                            const isElderly = (patient.edad || 0) >= 65;
                            if (isElderly) {
                                if (imcNum < 23) {
                                    abbrevStatus = 'BP';
                                    statusBgStyle = 'background:#fee2e2; color:#991b1b; font-weight:800;';
                                } else if (imcNum < 28) {
                                    abbrevStatus = 'N';
                                    statusBgStyle = 'background:#dcfce7; color:#166534; font-weight:700;';
                                } else if (imcNum < 32) {
                                    abbrevStatus = 'SP';
                                    statusBgStyle = 'background:#fef3c7; color:#92400e; font-weight:700;';
                                } else {
                                    abbrevStatus = 'OB';
                                    statusBgStyle = 'background:#ffedd5; color:#c2410c; font-weight:700;';
                                }
                            } else {
                                if (imcNum < 18.5) {
                                    abbrevStatus = 'BP';
                                    statusBgStyle = 'background:#fee2e2; color:#991b1b; font-weight:800;';
                                } else if (imcNum < 25) {
                                    abbrevStatus = 'N';
                                    statusBgStyle = 'background:#dcfce7; color:#166534; font-weight:700;';
                                } else if (imcNum < 30) {
                                    abbrevStatus = 'SP';
                                    statusBgStyle = 'background:#fef3c7; color:#92400e; font-weight:700;';
                                } else {
                                    abbrevStatus = 'OB';
                                    statusBgStyle = 'background:#ffedd5; color:#c2410c; font-weight:700;';
                                }
                            }
                        }

                        // Dietoterapia text (Régimen FIRST)
                        const regimenVal = patient.metadata?.regimen || '';
                        let dietDetail = '';
                        const formula = patient.metadata?.simulator?.formula || '';
                        if (formula) {
                            dietDetail = formula;
                        } else if (patient.metadata?.simulator?.oral?.kcal) {
                            dietDetail = `Oral (${patient.metadata.simulator.oral.kcal} kcal)`;
                        }
                        let dietText = regimenVal ? (dietDetail ? `${regimenVal} | ${dietDetail}` : regimenVal) : (dietDetail || 'Normal');

                        // NRS score
                        // SCRG (Screening) column
                        let nrsVal = '--';
                        let nrsBgStyle = 'color: #1e3a8a; font-weight: 700;';
                        const rawScrg = patient.metadata?.screening_score || patient.metadata?.nrs_score || patient.metadata?.nrs2002?.score || patient.metadata?.strongkids?.score || patient.metadata?.assessment?.cribaje?.nrs;
                        if (rawScrg !== undefined && rawScrg !== null && rawScrg !== '' && rawScrg !== 'No evaluado' && rawScrg !== '--') {
                            if (typeof rawScrg === 'number') {
                                nrsVal = `${rawScrg} pts`;
                                if (rawScrg >= 3) nrsBgStyle = 'background:#fee2e2; color:#c0392b; font-weight:800; border-radius:4px; padding:2px 6px;';
                                else nrsBgStyle = 'background:#dcfce7; color:#166534; font-weight:700; border-radius:4px; padding:2px 6px;';
                            } else {
                                nrsVal = String(rawScrg);
                                if (nrsVal.includes('pts')) {
                                    const num = parseInt(nrsVal);
                                    if (!isNaN(num)) {
                                        if (num >= 3) nrsBgStyle = 'background:#fee2e2; color:#c0392b; font-weight:800; border-radius:4px; padding:2px 6px;';
                                        else nrsBgStyle = 'background:#dcfce7; color:#166534; font-weight:700; border-radius:4px; padding:2px 6px;';
                                    }
                                }
                            }
                        }

                        // Evaluacion type
                        const evalType = patient.metadata?.patient_type === 'pediatric' ? 'Peds' : (patient.metadata?.patient_type === 'neonate' ? 'Neo' : 'VGO');

                        // Sex letter
                        const sexLetter = patient.sexo === 'm' ? 'M' : (patient.sexo === 'f' ? 'F' : '--');

                        // Admission date
                        const firstAdmittedStr = patient.metadata?.fecha_ingreso_servicio || '--';

                        // Format evaluation date for Name column (ONLY if actually evaluated)
                        let dateStr = '';
                        const hasEvaluation = patient.evaluado || patient.metadata?.evaluado || patient.metadata?.fecha_evaluacion || (patient.metadata?.assessment && Object.keys(patient.metadata.assessment).length > 0) || (patient.peso_kg > 0);
                        if (hasEvaluation) {
                            const evalDate = patient.metadata?.fecha_evaluacion || patient.created_at;
                            if (evalDate) {
                                const d = new Date(evalDate);
                                const day = String(d.getDate()).padStart(2, '0');
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                dateStr = `${day}-${month}`;
                            }
                        }

                        tableHTML += `
                            <tr id="row_pat_${patient.id}" data-patient-id="${patient.id}" data-age="${patient.edad || 0}" style="${rowStyle}">
                                <td class="col-cama" style="padding: 0;"><div class="resizable-tr">🛏️ ${bedName}</div></td>
                                <td class="col-ficha" style="padding: 0;"><div class="resizable-tr"><input type="text" value="${numFicha}" placeholder="Ficha / RUT" style="width:100%; border:none; background:transparent; font-size:0.72rem; font-weight:bold; color:#475569; outline:none;" onchange="window.quickUpdatePatientField('${patient.id}', 'num_ficha', this.value)" title="Número de Ficha / RUT (Editar)"></div></td>
                                <td class="col-nombre" style="padding: 2px 6px; line-height: 1.2;">
                                    <input type="text" value="${patient.nombre || ''}" style="width:100%; border:none; background:transparent; font-size:0.75rem; color:#312e81; font-weight:700; outline:none;" onchange="window.quickUpdatePatientField('${patient.id}', 'nombre', this.value)" title="Nombre (Editar)">
                                    ${dateStr ? `<span style="font-size:0.6rem; color:#7c3aed; font-weight:bold; display:block; cursor:pointer;" onclick="loadPatient('${patient.id}')">EVA ${dateStr}</span>` : ''}
                                </td>
                                <td class="col-edad" style="padding: 6px 10px; text-align: center;">${ageStr}</td>
                                <td class="col-dx" style="padding: 2px 4px;"><textarea placeholder="Diagnóstico" style="width:100%; border:none; background:transparent; font-size:0.7rem; color:#475569; outline:none; resize:vertical; font-family:inherit; min-height:22px; line-height:1.2;" onchange="window.quickUpdatePatientField('${patient.id}', 'diagnostico', this.value)" title="Diagnóstico (Editar)">${patient.diagnostico || ''}</textarea></td>
                                <td class="col-patologia" style="padding: 2px; text-align: center; background:#fdf2f8; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0;"><input type="checkbox" ${patient.metadata?.patologia_dm ? 'checked' : ''} onchange="window.quickUpdatePatientField('${patient.id}', 'patologia_dm', this.checked)" style="cursor:pointer; width:15px; height:15px; accent-color:#dc2626;" title="DM (Marcar/Desmarcar)"></td>
                                <td class="col-patologia" style="padding: 2px; text-align: center; background:#fdf2f8; border-right:1px solid #e2e8f0;"><input type="checkbox" ${patient.metadata?.patologia_hta ? 'checked' : ''} onchange="window.quickUpdatePatientField('${patient.id}', 'patologia_hta', this.checked)" style="cursor:pointer; width:15px; height:15px; accent-color:#dc2626;" title="HTA (Marcar/Desmarcar)"></td>
                                <td class="col-patologia" style="padding: 2px; text-align: center; background:#fdf2f8; border-right:1px solid #e2e8f0;"><input type="checkbox" ${patient.metadata?.patologia_erc ? 'checked' : ''} onchange="window.quickUpdatePatientField('${patient.id}', 'patologia_erc', this.checked)" style="cursor:pointer; width:15px; height:15px; accent-color:#dc2626;" title="ERC (Marcar/Desmarcar)"></td>
                                <td class="col-dieta" style="padding: 2px 4px;"><textarea placeholder="Régimen / Dietoterapia" style="width:100%; border:none; background:transparent; font-size:0.7rem; color:#0f766e; font-weight:600; outline:none; resize:vertical; font-family:inherit; min-height:22px; line-height:1.2;" onchange="window.quickUpdatePatientField('${patient.id}', 'regimen', this.value)" title="Dietoterapia (Editar)">${dietText}</textarea></td>
                                <td class="col-obs" style="padding: 2px 4px;"><textarea placeholder="Observaciones..." style="width:100%; border:none; background:transparent; font-size:0.65rem; color:#64748b; outline:none; resize:vertical; font-family:inherit; min-height:22px; line-height:1.2;" onchange="window.quickUpdatePatientField('${patient.id}', 'obs_generales', this.value)" title="Observaciones (Editar - Alt+Enter o Enter para nueva línea)">${customObs || ''}</textarea></td>
                                <td class="col-antropo" style="padding: 2px; text-align: center;"><input type="number" step="0.1" value="${patient.peso_kg || ''}" placeholder="--" class="input-table-peso" style="width:100%; border:none; background:transparent; text-align:center; font-weight:700; font-size:0.75rem; color:#1e293b; outline:none;" oninput="window.calculateTableIMC('${patient.id}')" onchange="window.quickUpdatePatientField('${patient.id}', 'peso_kg', this.value)" title="Peso (Editar)"></td>
                                <td class="col-antropo" style="padding: 2px; text-align: center;"><input type="number" step="0.1" value="${patient.talla_cm || (patient.estatura_m ? Math.round(patient.estatura_m * 100) : '')}" placeholder="--" class="input-table-talla" style="width:100%; border:none; background:transparent; text-align:center; font-size:0.75rem; color:#1e293b; outline:none;" oninput="window.calculateTableIMC('${patient.id}')" onchange="window.quickUpdatePatientField('${patient.id}', 'talla_cm', this.value)" title="Talla cm (Editar)"></td>
                                <td class="col-imc" id="table_imc_${patient.id}" style="padding: 6px 10px; text-align: center; font-weight:700; color:#1e3a8a;">${imcStr}</td>
                                <td class="col-imc" id="table_est_${patient.id}" style="padding: 6px 10px; text-align: center; ${statusBgStyle}">${abbrevStatus}</td>
                                <td class="col-nrs" id="table_scrg_${patient.id}" style="padding: 6px 10px; text-align: center;"><span style="${nrsBgStyle}">${nrsVal}</span></td>
                                <td class="col-lpp" style="padding: 2px; text-align: center;">
                                    <select onchange="window.quickUpdatePatientField('${patient.id}', 'riesgo_lpp', this.value)" style="border:none; background:transparent; font-weight:700; font-size:0.7rem; color:${patient.metadata?.riesgo_lpp === 'Alto' ? '#ef4444' : (patient.metadata?.riesgo_lpp === 'Medio' ? '#f59e0b' : '#10b981')}; outline:none; cursor:pointer;" title="Riesgo LPP (Editar)">
                                        <option value="Sin evaluar" ${!patient.metadata?.riesgo_lpp || patient.metadata?.riesgo_lpp === 'Sin evaluar' ? 'selected' : ''}>--</option>
                                        <option value="Bajo" ${patient.metadata?.riesgo_lpp === 'Bajo' ? 'selected' : ''}>Bajo</option>
                                        <option value="Medio" ${patient.metadata?.riesgo_lpp === 'Medio' ? 'selected' : ''}>Medio</option>
                                        <option value="Alto" ${patient.metadata?.riesgo_lpp === 'Alto' ? 'selected' : ''}>Alto</option>
                                    </select>
                                </td>
                                <td class="col-eval" style="padding: 4px 6px; text-align: center;">${getEvalPillsHTML(patient, true)}</td>
                                <td class="col-edad" style="padding: 6px 10px; text-align: center;">${sexLetter}</td>
                                <td class="col-eval" style="padding: 6px 10px; text-align: center;">${firstAdmittedStr}</td>
                                <td style="padding: 6px 10px; text-align: center;">
                                    <button class="circle-action-btn" title="Editar Ficha" onclick="loadPatient('${patient.id}')" style="padding:2px 4px; font-size:0.75rem;">📝</button>
                                    <button class="circle-action-btn success" title="Dar de Alta" onclick="window.dischargePatientGrid('${patient.id}')" style="padding:2px 4px; font-size:0.75rem;">✔️</button>
                                </td>
                            </tr>
                        `;
                    } else {
                        tableHTML += `
                            <tr class="empty-bed-row" style="border-bottom: 1px solid #e2e8f0; height: 42px; background: #fafafa;">
                                <td colspan="20" style="padding: 6px 10px; text-align: left; color: #94a3b8;">
                                    <span style="font-size:0.7rem; font-weight:700; background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; margin-right: 15px;">${bedName}</span>
                                    <span style="font-size:0.7rem;">DISPONIBLE</span>
                                    <button class="btn-register-patient" onclick="window.registerPatientInBed('${bedName}')" style="padding: 2px 8px; font-size: 0.65rem; margin-left:10px;">
                                        ➕ Registrar Paciente
                                    </button>
                            </tr>
                        `;
                    }
                });
            });

            // Floating patients at the bottom of the table
            let tableFloatingPatients = floatingPatients;
            if (evalFilter !== 'all') {
                tableFloatingPatients = floatingPatients.filter(p => p._matchesEvalFilter);
            }
            if (tableFloatingPatients.length > 0) {
                const isFloatingCollapsedTable = collapsedRooms.includes('PACIENTES QUE YA NO ESTÁN EN EL SERVICIO') || collapsedRooms.includes('Pacientes sin Cama');
                tableHTML += `
                    <tr style="background: #fdf2f8; font-weight: 800; color: #db2777; border-top: 2px solid #fbcfe8; height: 36px; cursor: pointer;" onclick="window.toggleRoomCollapse('PACIENTES QUE YA NO ESTÁN EN EL SERVICIO', 'room-group-floating-table')">
                        <td colspan="20" style="padding: 6px 10px; font-size: 0.8rem; border-bottom: 1px solid #fbcfe8; text-transform: uppercase;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span class="room-toggle-icon" style="display:inline-block; transition: transform 0.2s ease; ${isFloatingCollapsedTable ? 'transform: rotate(-90deg);' : ''}">▼</span> ⚠️ PACIENTES QUE YA NO ESTÁN EN EL SERVICIO (${tableFloatingPatients.length})
                                </div>
                                <button onclick="event.stopPropagation(); window.dischargeAllFloatingPatients();" style="background:#be123c; color:white; border:none; border-radius:6px; padding:3px 10px; font-size:0.72rem; font-weight:bold; cursor:pointer;" title="Dar de alta masiva a todos los pacientes que ya no están en este servicio">🧹 Dar de alta a todos (${tableFloatingPatients.length})</button>
                            </div>
                        </td>
                    </tr>
                `;

                if (!isFloatingCollapsedTable) {
                    tableFloatingPatients.forEach(patient => {
                        const numFicha = patient.metadata?.num_ficha || '';
                        const ageStr = patient.edad || '--';
                        const imcNum = patient.peso_kg > 0 && patient.estatura_m > 0 ? (patient.peso_kg / (patient.estatura_m * patient.estatura_m)) : 0;
                        const imcStr = imcNum > 0 ? imcNum.toFixed(1).replace('.', ',') : '--';
                        let abbrevStatus = '--';
                        if (imcNum > 0) {
                            const isElderly = patient.edad >= 65;
                            if (isElderly) {
                                if (imcNum < 23) abbrevStatus = 'BP'; else if (imcNum < 28) abbrevStatus = 'N'; else if (imcNum < 32) abbrevStatus = 'SP'; else abbrevStatus = 'OB';
                            } else {
                                if (imcNum < 18.5) abbrevStatus = 'BP'; else if (imcNum < 25) abbrevStatus = 'N'; else if (imcNum < 30) abbrevStatus = 'SP'; else abbrevStatus = 'OB';
                            }
                        }
                        const dietText = (patient.metadata?.regimen || 'Normal');
                        // SCRG (Screening) column for floating patients
                        let nrsVal = '--';
                        let nrsBgStyle = 'color: #db2777; font-weight: 700;';
                        const rawScrg = patient.metadata?.screening_score || patient.metadata?.nrs_score || patient.metadata?.nrs2002?.score || patient.metadata?.strongkids?.score || patient.metadata?.assessment?.cribaje?.nrs;
                        if (rawScrg !== undefined && rawScrg !== null && rawScrg !== '' && rawScrg !== 'No evaluado' && rawScrg !== '--') {
                            if (typeof rawScrg === 'number') {
                                nrsVal = `${rawScrg} pts`;
                                if (rawScrg >= 3) nrsBgStyle = 'background:#fee2e2; color:#c0392b; font-weight:800; border-radius:4px; padding:2px 6px;';
                                else nrsBgStyle = 'background:#dcfce7; color:#166534; font-weight:700; border-radius:4px; padding:2px 6px;';
                            } else {
                                nrsVal = String(rawScrg);
                                if (nrsVal.includes('pts')) {
                                    const num = parseInt(nrsVal);
                                    if (!isNaN(num)) {
                                        if (num >= 3) nrsBgStyle = 'background:#fee2e2; color:#c0392b; font-weight:800; border-radius:4px; padding:2px 6px;';
                                        else nrsBgStyle = 'background:#dcfce7; color:#166534; font-weight:700; border-radius:4px; padding:2px 6px;';
                                    }
                                }
                            }
                        }
                        const evalType = patient.metadata?.patient_type === 'pediatric' ? 'Peds' : (patient.metadata?.patient_type === 'neonate' ? 'Neo' : 'VGO');
                        const sexLetter = patient.sexo === 'm' ? 'M' : (patient.sexo === 'f' ? 'F' : '--');
                        const fIngr = patient.metadata?.fecha_ingreso_servicio || '--';
                        const dateStr = patient.created_at ? `${String(new Date(patient.created_at).getDate()).padStart(2, '0')}-${String(new Date(patient.created_at).getMonth() + 1).padStart(2, '0')}` : '';

                        tableHTML += `
                            <tr id="row_pat_${patient.id}" data-patient-id="${patient.id}" data-age="${patient.edad || 0}" style="background: #fff5f8; border-bottom: 1px solid #fbcfe8; height: 42px;">
                                <td class="col-cama" style="padding: 0;"><div class="resizable-tr" style="color: #db2777;">📋 Sin Cama</div></td>
                                <td class="col-ficha" style="padding: 0;"><div class="resizable-tr"><input type="text" value="${numFicha}" placeholder="Ficha / RUT" style="width:100%; border:none; background:transparent; font-size:0.72rem; font-weight:bold; color:#475569; outline:none;" onchange="window.quickUpdatePatientField('${patient.id}', 'num_ficha', this.value)" title="Número de Ficha / RUT (Editar)"></div></td>
                                <td class="col-nombre" style="padding: 2px 6px; line-height: 1.2;">
                                    <input type="text" value="${patient.nombre || ''}" style="width:100%; border:none; background:transparent; font-size:0.75rem; color:#312e81; font-weight:700; outline:none;" onchange="window.quickUpdatePatientField('${patient.id}', 'nombre', this.value)" title="Nombre (Editar)">
                                    ${dateStr ? `<span style="font-size:0.6rem; color:#7c3aed; font-weight:bold; display:block; cursor:pointer;" onclick="loadPatient('${patient.id}')">EVA ${dateStr}</span>` : ''}
                                </td>
                                <td class="col-edad" style="padding: 6px 10px; text-align: center;">${ageStr}</td>
                                <td class="col-dx" style="padding: 2px 4px;"><input type="text" value="${patient.diagnostico || ''}" placeholder="Diagnóstico" style="width:100%; border:none; background:transparent; font-size:0.7rem; color:#475569; outline:none;" onchange="window.quickUpdatePatientField('${patient.id}', 'diagnostico', this.value)" title="Diagnóstico (Editar)"></td>
                                <td class="col-patologia" style="padding: 2px; text-align: center; background:#fdf2f8; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0;"><input type="checkbox" ${patient.metadata?.patologia_dm ? 'checked' : ''} onchange="window.quickUpdatePatientField('${patient.id}', 'patologia_dm', this.checked)" style="cursor:pointer; width:15px; height:15px; accent-color:#dc2626;" title="DM (Marcar/Desmarcar)"></td>
                                <td class="col-patologia" style="padding: 2px; text-align: center; background:#fdf2f8; border-right:1px solid #e2e8f0;"><input type="checkbox" ${patient.metadata?.patologia_hta ? 'checked' : ''} onchange="window.quickUpdatePatientField('${patient.id}', 'patologia_hta', this.checked)" style="cursor:pointer; width:15px; height:15px; accent-color:#dc2626;" title="HTA (Marcar/Desmarcar)"></td>
                                <td class="col-patologia" style="padding: 2px; text-align: center; background:#fdf2f8; border-right:1px solid #e2e8f0;"><input type="checkbox" ${patient.metadata?.patologia_erc ? 'checked' : ''} onchange="window.quickUpdatePatientField('${patient.id}', 'patologia_erc', this.checked)" style="cursor:pointer; width:15px; height:15px; accent-color:#dc2626;" title="ERC (Marcar/Desmarcar)"></td>
                                <td class="col-dieta" style="padding: 2px 4px;"><input type="text" value="${dietText}" placeholder="Régimen / Dietoterapia" style="width:100%; border:none; background:transparent; font-size:0.7rem; color:#0f766e; font-weight:600; outline:none;" onchange="window.quickUpdatePatientField('${patient.id}', 'regimen', this.value)" title="Dietoterapia (Editar)"></td>
                                <td class="col-obs" style="padding: 2px 4px;"><input type="text" value="${patient.metadata?.observaciones_generales || ''}" placeholder="Observaciones..." style="width:100%; border:none; background:transparent; font-size:0.65rem; color:#64748b; outline:none;" onchange="window.quickUpdatePatientField('${patient.id}', 'obs_generales', this.value)" title="Observaciones (Editar)"></td>
                                <td class="col-antropo" style="padding: 2px; text-align: center;"><input type="number" step="0.1" value="${patient.peso_kg || ''}" placeholder="--" class="input-table-peso" style="width:100%; border:none; background:transparent; text-align:center; font-weight:700; font-size:0.75rem; color:#1e293b; outline:none;" oninput="window.calculateTableIMC('${patient.id}')" onchange="window.quickUpdatePatientField('${patient.id}', 'peso_kg', this.value, true)" title="Peso (Editar)"></td>
                                <td class="col-antropo" style="padding: 2px; text-align: center;"><input type="number" step="0.1" value="${patient.talla_cm || ''}" placeholder="--" class="input-table-talla" style="width:100%; border:none; background:transparent; text-align:center; font-size:0.75rem; color:#1e293b; outline:none;" oninput="window.calculateTableIMC('${patient.id}')" onchange="window.quickUpdatePatientField('${patient.id}', 'talla_cm', this.value, true)" title="Talla cm (Editar)"></td>
                                <td class="col-imc" id="table_imc_${patient.id}" style="padding: 6px 10px; text-align: center; font-weight:700; color:#9d174d;">${imcStr}</td>
                                <td class="col-imc" id="table_est_${patient.id}" style="padding: 6px 10px; text-align: center; font-weight:700; color:#9d174d;">${abbrevStatus}</td>
                                <td class="col-nrs" id="table_scrg_${patient.id}" style="padding: 6px 10px; text-align: center;"><span style="${nrsBgStyle}">${nrsVal}</span></td>
                                <td class="col-lpp" style="padding: 2px; text-align: center;">
                                    <select onchange="window.quickUpdatePatientField('${patient.id}', 'riesgo_lpp', this.value)" style="border:none; background:transparent; font-weight:700; font-size:0.7rem; color:${patient.metadata?.riesgo_lpp === 'Alto' ? '#ef4444' : (patient.metadata?.riesgo_lpp === 'Medio' ? '#f59e0b' : '#10b981')}; outline:none; cursor:pointer;" title="Riesgo LPP (Editar)">
                                        <option value="Sin evaluar" ${!patient.metadata?.riesgo_lpp || patient.metadata?.riesgo_lpp === 'Sin evaluar' ? 'selected' : ''}>--</option>
                                        <option value="Bajo" ${patient.metadata?.riesgo_lpp === 'Bajo' ? 'selected' : ''}>Bajo</option>
                                        <option value="Medio" ${patient.metadata?.riesgo_lpp === 'Medio' ? 'selected' : ''}>Medio</option>
                                        <option value="Alto" ${patient.metadata?.riesgo_lpp === 'Alto' ? 'selected' : ''}>Alto</option>
                                    </select>
                                </td>
                                <td class="col-eval" style="padding: 4px 6px; text-align: center;">${getEvalPillsHTML(patient, true)}</td>
                                <td class="col-edad" style="padding: 6px 10px; text-align: center;">${sexLetter}</td>
                                <td class="col-eval" style="padding: 6px 10px; text-align: center;">${fIngr}</td>
                                <td style="padding: 6px 10px; text-align: center;">
                                    <div style="display:flex; gap:4px; justify-content:center;">
                                        <button class="circle-action-btn" title="Editar Ficha" onclick="loadPatient('${patient.id}')" style="padding:2px 4px; font-size:0.7rem;">📝</button>
                                        <button class="circle-action-btn success" title="Dar de Alta" onclick="window.dischargePatientGrid('${patient.id}')" style="padding:2px 4px; font-size:0.7rem;">✔️</button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                }
            }

            tableHTML += `
                        </tbody>
                    </table>
                </div>
            `;

            grid.innerHTML = tableHTML;
            if (scrollX > 0) {
                const newScrollDiv = grid.querySelector('div[style*="overflow-x"]');
                if (newScrollDiv) newScrollDiv.scrollLeft = scrollX;
            }
            if (window.scrollY !== scrollY) {
                window.scrollTo({ top: scrollY, behavior: 'instant' });
            }
            if (typeof window.initTableColumnResizing === 'function') {
                setTimeout(window.initTableColumnResizing, 50);
            }
            return;
        }

        grid.innerHTML = '';
        grid.style.display = '';
        grid.style.width = '';
        
        groupOrder.forEach((roomName, roomIndex) => {
            const bedsInRoom = groupedBeds[roomName];
            const matchingInRoom = bedsInRoom.filter(b => {
                const cleanB = b.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                const p = matchedPatients.find(pat => pat.cama === b || (pat.cama && pat.cama.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanB));
                return p && (evalFilter === 'all' || p._matchesEvalFilter);
            }).length;
            if (evalFilter !== 'all' && matchingInRoom === 0) return;

            const elementId = `room-group-${roomIndex}`;
            
            // Calculate stats for this room
            let totalBeds = bedsInRoom.length;
            let occupiedCount = 0;
            let emptyCount = 0;
            let hasCritical = false;
            
            bedsInRoom.forEach(bedName => {
                const patient = matchedPatients.find(p => p.cama === bedName);
                if (patient) {
                    occupiedCount++;
                    if (patient.estado_sala === 'critico' || patient.requiere_atencion) {
                        hasCritical = true;
                    }
                } else {
                    emptyCount++;
                }
            });
            
            const isCollapsed = collapsedRooms.includes(roomName);
            
            const roomGroup = document.createElement('div');
            roomGroup.id = elementId;
            roomGroup.className = `room-group ${isCollapsed ? 'collapsed' : ''} ${hasCritical ? 'has-critical' : ''}`;
            
            // Render header
            let summaryHTML = `
                <span class="room-summary-badge total">${totalBeds} ${totalBeds === 1 ? 'cama' : 'camas'}</span>
            `;
            if (occupiedCount > 0) {
                summaryHTML += `<span class="room-summary-badge occupied">${occupiedCount} ${occupiedCount === 1 ? 'ocupada' : 'ocupadas'}</span>`;
            }
            if (emptyCount > 0) {
                summaryHTML += `<span class="room-summary-badge empty">${emptyCount} ${emptyCount === 1 ? 'disponible' : 'disponibles'}</span>`;
            }
            if (hasCritical) {
                summaryHTML += `<span class="room-summary-badge critical-alert">🚨 CRÍTICO</span>`;
            }
            
            const headerHTML = `
                <div class="room-group-header" onclick="window.toggleRoomCollapse('${roomName.replace(/'/g, "\\'")}', '${elementId}')">
                    <div class="room-title-container">
                        <span class="room-toggle-icon">▼</span>
                        <span>${roomName === 'Cupos del Servicio' ? 'Área / Cupos del Servicio' : roomName}</span>
                    </div>
                    <div class="room-badges-container">
                        ${summaryHTML}
                    </div>
                </div>
            `;
            
            const bedsGridDiv = document.createElement('div');
            bedsGridDiv.className = 'room-beds-grid beds-grid';
            bedsGridDiv.style.marginTop = '0';
            
            bedsInRoom.forEach(bedName => {
                const cleanB = bedName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                const patient = matchedPatients.find(p => p.cama === bedName || (p.cama && p.cama.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanB));
                
                if (evalFilter !== 'all' && (!patient || !patient._matchesEvalFilter)) {
                    return;
                }

                const card = document.createElement('div');
                
                if (patient) {
                    const isCritico = patient.estado_sala === 'critico' || patient.requiere_atencion;
                    card.className = `bed-card occupied ${isCritico ? 'critical' : 'active'}`;
                    
                    const tmtKcal = patient.tmt || '--';
                    const weight = patient.peso_kg || '--';
                    const dx = patient.diagnostico || 'Sin diagnóstico';
                    const numFicha = patient.metadata?.num_ficha || '';
                    const regimen = patient.metadata?.regimen || '';
                    const isDM = patient.metadata?.patologia_dm;
                    const obsGen = patient.metadata?.observaciones_generales || '';
                    const formula = patient.metadata?.simulator?.formula || 'Ninguna';
                    
                    card.innerHTML = `
                        <div class="bed-header">
                            <span class="bed-badge occupied">🛏️ ${bedName}</span>
                            ${isCritico ? '<span class="status-alert-tag critical">🚨 CRÍTICO</span>' : '<span class="status-alert-tag active">🟢 ACTIVO</span>'}
                        </div>
                        <div class="bed-patient-info" onclick="loadPatient('${patient.id}')" style="cursor:pointer;" title="Haga clic para editar ficha de ${patient.nombre}">
                            <div class="patient-name" style="font-weight:800; color:#312e81; font-size:0.85rem;">${patient.nombre}</div>
                            ${numFicha ? `<div style="font-size:0.7rem; color:#475569; font-weight:700;">📄 Ficha: <b>${numFicha}</b></div>` : ''}
                            <div class="patient-dx" style="font-size:0.72rem; color:#475569; margin:2px 0;">${dx} ${isDM ? '<span style="background:#fee2e2; color:#b91c1c; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:4px; margin-left:4px;">🩸 DM</span>' : ''}</div>
                            <div class="patient-metrics-row" style="margin:4px 0;">
                                <span class="metric-item" title="Edad">🎂 ${patient.edad}a</span>
                                <span class="metric-item" title="Peso">⚖️ ${weight}kg</span>
                            </div>
                            ${regimen ? `<div style="font-size:0.75rem; color:#0f766e; font-weight:700; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:3px 6px; margin:4px 0;">🍲 ${regimen}</div>` : ''}
                            ${obsGen ? `<div style="font-size:0.68rem; color:#b45309; font-weight:600; background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:3px 6px; margin-top:3px;">⚠️ ${obsGen}</div>` : ''}
                            <div class="bed-eval-pills-row" style="display:flex; align-items:center; justify-content:space-between; margin-top:6px; padding-top:4px; border-top:1px dashed #e2e8f0;">
                                <span style="font-size:0.68rem; font-weight:700; color:#64748b;">Evaluación:</span>
                                ${getEvalPillsHTML(patient, false)}
                            </div>
                        </div>
                        <div class="bed-actions-row">
                            <button class="circle-action-btn" title="Editar Ficha" onclick="loadPatient('${patient.id}')">📝</button>
                            <button class="circle-action-btn" title="Cambiar Estado" onclick="window.togglePatientStateGrid('${patient.id}', '${isCritico ? 'activo' : 'critico'}')">${isCritico ? '↩️' : '🚨'}</button>
                            <button class="circle-action-btn success" title="Dar de Alta" onclick="window.dischargePatientGrid('${patient.id}')">✔️</button>
                        </div>
                        ${isAdmin ? `<button class="btn-delete-bed-absolute" title="Eliminar Cama del Servicio" onclick="window.removeBedFromService('${bedName}')">🗑️</button>` : ''}
                    `;
                } else {
                    card.className = 'bed-card empty';
                    card.innerHTML = `
                        <div class="bed-header">
                            <span class="bed-badge empty">🛏️ ${bedName}</span>
                            <span class="status-alert-tag empty">DISPONIBLE</span>
                        </div>
                        <div class="empty-bed-body">
                            <button class="btn-register-patient" onclick="window.registerPatientInBed('${bedName}')">
                                ➕ Registrar
                            </button>
                        </div>
                        ${isAdmin ? `<button class="btn-delete-bed-absolute" title="Eliminar Cama del Servicio" onclick="window.removeBedFromService('${bedName}')">🗑️</button>` : ''}
                    `;
                }
                
                bedsGridDiv.appendChild(card);
            });
            
            roomGroup.innerHTML = headerHTML;
            roomGroup.appendChild(bedsGridDiv);
            grid.appendChild(roomGroup);
        });

        // 4. Render active patients who are not assigned to a bed in the configured bedsList (Floating / Cupos)
        floatingPatients = matchedPatients.filter(p => !bedsList.includes(p.cama));
        if (evalFilter !== 'all') {
            floatingPatients = floatingPatients.filter(p => p._matchesEvalFilter);
        }
        if (floatingPatients.length > 0) {
            const elementId = `room-group-floating`;
            const isFloatingCollapsed = collapsedRooms.includes('PACIENTES QUE YA NO ESTÁN EN EL SERVICIO') || collapsedRooms.includes('Pacientes sin Cama');
            const roomGroup = document.createElement('div');
            roomGroup.id = elementId;
            roomGroup.className = `room-group ${isFloatingCollapsed ? 'collapsed' : ''}`;
            
            let summaryHTML = `
                <span class="room-summary-badge occupied">${floatingPatients.length} ${floatingPatients.length === 1 ? 'paciente' : 'pacientes'}</span>
            `;
            
            const headerHTML = `
                <div class="room-group-header" onclick="window.toggleRoomCollapse('PACIENTES QUE YA NO ESTÁN EN EL SERVICIO', '${elementId}')" style="background: #fdf2f8; border-left: 4px solid #db2777; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <div class="room-title-container">
                        <span class="room-toggle-icon">▼</span>
                        <span style="color: #db2777; font-weight: bold;">⚠️ PACIENTES QUE YA NO ESTÁN EN EL SERVICIO</span>
                    </div>
                    <div class="room-badges-container" style="display:flex; align-items:center; gap:10px;">
                        ${summaryHTML}
                        <button onclick="event.stopPropagation(); window.dischargeAllFloatingPatients();" style="background:#be123c; color:white; border:none; border-radius:6px; padding:3px 10px; font-size:0.72rem; font-weight:bold; cursor:pointer;" title="Dar de alta masiva a todos los pacientes que ya no están en este servicio">🧹 Dar de alta a todos (${floatingPatients.length})</button>
                    </div>
                </div>
            `;
            
            const bedsGridDiv = document.createElement('div');
            bedsGridDiv.className = 'room-beds-grid beds-grid';
            bedsGridDiv.style.marginTop = '0';
            
            floatingPatients.forEach(patient => {
                const card = document.createElement('div');
                const isCritico = patient.estado_sala === 'critico' || patient.requiere_atencion;
                card.className = `bed-card occupied ${isCritico ? 'critical' : 'active'}`;
                
                const tmtKcal = patient.tmt || '--';
                const weight = patient.peso_kg || '--';
                const dx = patient.diagnostico || 'Sin diagnóstico';
                const formula = patient.metadata?.simulator?.formula || 'Ninguna';
                const displayBed = patient.cama || 'Sin Cama';
                
                card.innerHTML = `
                    <div class="bed-header" style="background: #fdf2f8;">
                        <span class="bed-badge occupied" style="background: #db2777; color: white;">📋 ${displayBed}</span>
                        ${isCritico ? '<span class="status-alert-tag critical">🚨 CRÍTICO</span>' : '<span class="status-alert-tag active">🟢 ACTIVO</span>'}
                    </div>
                    <div class="bed-patient-info" onclick="loadPatient('${patient.id}')" style="cursor:pointer;" title="Haga clic para editar ficha">
                        <div class="patient-name">${patient.nombre}</div>
                        <div class="patient-dx">${dx}</div>
                        <div class="patient-metrics-row">
                            <span class="metric-item" title="Edad">🎂 ${patient.edad}a</span>
                            <span class="metric-item" title="Peso">⚖️ ${weight}kg</span>
                        </div>
                        <div class="patient-regime-row">
                            <div class="regime-formula" title="Fórmula">🍼 ${formula}</div>
                            <div class="regime-req" title="Requerimiento">⚡ ${tmtKcal} kcal</div>
                        </div>
                        <div class="bed-eval-pills-row" style="display:flex; align-items:center; justify-content:space-between; margin-top:6px; padding-top:4px; border-top:1px dashed #e2e8f0;">
                            <span style="font-size:0.68rem; font-weight:700; color:#64748b;">Evaluación:</span>
                            ${getEvalPillsHTML(patient, false)}
                        </div>
                    </div>
                    <div class="bed-actions-row">
                        <button class="circle-action-btn" title="Editar Ficha" onclick="loadPatient('${patient.id}')">📝</button>
                        <button class="circle-action-btn" title="Cambiar Estado" onclick="window.togglePatientStateGrid('${patient.id}', '${isCritico ? 'activo' : 'critico'}')">${isCritico ? '↩️' : '🚨'}</button>
                        <button class="circle-action-btn success" title="Dar de Alta" onclick="window.dischargePatientGrid('${patient.id}')">✔️</button>
                    </div>
                `;
                bedsGridDiv.appendChild(card);
            });
            
            roomGroup.innerHTML = headerHTML;
            roomGroup.appendChild(bedsGridDiv);
            grid.appendChild(roomGroup);
        }

        if (window.scrollY !== scrollY) {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
        }
        
    } catch (err) {
        console.error("Error rendering beds grid:", err);
        grid.innerHTML = `<p style="color:red; text-align:center; padding:40px;">Error al cargar la sala: ${err.message}</p>`;
    }
};

window.registerPatientInBed = async function(bedName) {
    // 1. Limpiar completamente los datos del paciente anterior sin pedir confirmación
    if (typeof resetPatientForm === 'function') {
        await resetPatientForm(true);
    }
    
    // 2. Asignar el número de cama seleccionado en el formulario y en AppState
    const camaInput = document.getElementById('cama');
    if (camaInput) {
        camaInput.value = bedName;
    }
    if (AppState && AppState.patient) {
        AppState.patient.cama = bedName;
    }
    
    // 3. Cambiar automáticamente a la vista de Cálculo Nutricional / Ficha
    if (typeof window.switchAppView === 'function') {
        window.switchAppView('dashboard');
    }
    
    // 4. Enfocar el campo de nombre del paciente
    const nameInput = document.getElementById('nombre');
    if (nameInput) {
        nameInput.focus();
    }
    
    showToast(`📝 Registrando paciente nuevo en la cama: ${bedName}`);
};

window.togglePatientStateGrid = async function(id, newState) {
    const dbId = await resolvePatientDbId(id);
    if (dbId && typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { error } = await supabaseClient.from('pacientes').update({ estado_sala: newState }).eq('id', dbId);
        if (error) console.warn("Supabase update state error:", error.message);
    }
    try {
        let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        const p = localCache.find(x => x && (x.id === id || x.id === dbId));
        if (p) {
            p.estado_sala = newState;
            localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
        }
    } catch(e) {}
    showToast("✅ Estado de paciente actualizado.");
    await window.renderWardBedsGrid();
};

window.readmitPatientGrid = async function(id) {
    return window.reactivateDischargedPatient(id);
};

window.reactivateDischargedPatient = async function(id) {
    if (!confirm("¿Desea re-ingresar a este paciente al servicio activo?")) return;

    showToast("⏳ Re-ingresando paciente...");

    const dbId = await resolvePatientDbId(id);
    let patientName = '';

    if (dbId && typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data: p } = await supabaseClient.from('pacientes').select('nombre').eq('id', dbId).maybeSingle();
        if (p) patientName = p.nombre || '';

        const { error } = await supabaseClient
            .from('pacientes')
            .update({ 
                estado_sala: 'activo',
                cama: '' 
            })
            .eq('id', dbId);

        if (error) console.warn("Supabase reactivate error:", error.message);
    }

    try {
        let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        const idx = localCache.findIndex(x => x && (x.id === id || x.id === dbId));
        if (idx >= 0) {
            localCache[idx].estado_sala = 'activo';
            localCache[idx].cama = '';
        }
        localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
    } catch(e) {}

    showToast(`↩️ ¡${patientName || 'Paciente'} re-ingresado a la sala activa!`);

    if (typeof window.loadHistoryList === 'function') {
        await window.loadHistoryList(false);
    }
    await window.renderWardBedsGrid();
};

window.dischargePatientGrid = async function(id) {
    if (!confirm("¿Está seguro de dar de alta a este paciente?")) return;
    
    const dbId = await resolvePatientDbId(id);
    let currentMeta = {};
    const nowIso = new Date().toISOString();

    if (dbId && typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data: p } = await supabaseClient.from('pacientes').select('metadata, created_at').eq('id', dbId).maybeSingle();
        if (p && p.metadata) {
            currentMeta = { ...p.metadata };
        }
        currentMeta.discharged_at = nowIso;
        if (!currentMeta.first_hospital_admitted_at) {
            currentMeta.first_hospital_admitted_at = currentMeta.fecha_ingreso_servicio || p?.created_at || nowIso;
        }
        if (!currentMeta.service_admitted_at) {
            currentMeta.service_admitted_at = currentMeta.fecha_ingreso_servicio || p?.created_at || nowIso;
        }
        
        const { error } = await supabaseClient.from('pacientes').update({ 
            estado_sala: 'de_alta',
            metadata: currentMeta
        }).eq('id', dbId);
        
        if (error) {
            console.warn("Supabase discharge error:", error.message);
        }
    }

    try {
        let localCache = JSON.parse(localStorage.getItem('local_ward_patients') || '[]');
        localCache = localCache.filter(p => p && p.id !== id && p.id !== dbId);
        localStorage.setItem('local_ward_patients', JSON.stringify(localCache));
    } catch(e) {}

    showToast("✅ Paciente dado de alta.");
    if (typeof window.loadHistoryList === 'function') {
        await window.loadHistoryList(false);
    }
    await window.renderWardBedsGrid();
};

let currentTransferringPatientId = null;
let currentTransferringPatientType = 'adult';
let currentAvailableServices = [];

window.transferPatientGrid = async function(id) {
    if (!supabaseClient) {
        alert("Supabase no está configurado.");
        return;
    }

    currentTransferringPatientId = id;

    // 1. Fetch patient details to get patient type & name
    const { data: p, error: fetchErr } = await supabaseClient
        .from('pacientes')
        .select('nombre, metadata, cama')
        .eq('id', id)
        .single();
    
    if (fetchErr || !p) {
        alert("Error al leer datos del paciente: " + (fetchErr?.message || "No encontrado"));
        return;
    }

    const patientType = (p.metadata && p.metadata.patient_type) || 'adult';
    currentTransferringPatientType = patientType;

    // 2. Collect all matching services from SERVICES_BY_FLOOR based on type
    currentAvailableServices = [];
    for (const floor in SERVICES_BY_FLOOR) {
        SERVICES_BY_FLOOR[floor].forEach(srv => {
            if (srv.type === patientType) {
                currentAvailableServices.push({
                    floor: parseInt(floor),
                    id: srv.id,
                    name: srv.name
                });
            }
        });
    }

    if (currentAvailableServices.length === 0) {
        alert(`No hay servicios configurados para el tipo de paciente: ${patientType}`);
        return;
    }

    // 3. Setup Modal HTML content
    const patientNameSpan = document.getElementById('transferPatientName');
    if (patientNameSpan) patientNameSpan.innerText = p.nombre;

    const srvSelect = document.getElementById('transferPatientServiceSelect');
    if (srvSelect) {
        srvSelect.innerHTML = currentAvailableServices.map((srv, idx) => 
            `<option value="${idx}">Piso ${srv.floor} - ${srv.name}</option>`
        ).join('');
    }

    // 4. Update the target beds list for the default selected service
    await window.updateTransferPatientBedsDropdown();

    // 5. Show modal
    const modal = document.getElementById('transferPatientModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closeTransferPatientModal = function() {
    const modal = document.getElementById('transferPatientModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentTransferringPatientId = null;
};

window.updateTransferPatientBedsDropdown = async function() {
    const srvSelect = document.getElementById('transferPatientServiceSelect');
    const bedSelect = document.getElementById('transferPatientBedSelect');
    const conflictAlert = document.getElementById('transferPatientConflictAlert');
    if (!srvSelect || !bedSelect) return;

    if (conflictAlert) conflictAlert.style.display = 'none';

    const selectedIdx = parseInt(srvSelect.value);
    const selectedSrv = currentAvailableServices[selectedIdx];
    if (!selectedSrv) return;

    const targetLocationKey = `HRA-${selectedSrv.floor}-${selectedSrv.id}`;
    let targetBeds = getDefaultBeds(selectedSrv.floor, selectedSrv.id);
    
    // Fetch custom bed config
    const { data: configRecord } = await supabaseClient
        .from('config_camas')
        .select('*')
        .eq('location_key', targetLocationKey)
        .maybeSingle();
        
    if (configRecord && configRecord.beds) {
        targetBeds = configRecord.beds;
    }

    // Populate beds select with default option for "Cupos del Servicio (Sin Cama)"
    let optionsHtml = `<option value="">Cupos del Servicio (Sin Cama)</option>`;
    targetBeds.forEach(bedName => {
        optionsHtml += `<option value="${bedName}">Cama ${bedName}</option>`;
    });
    bedSelect.innerHTML = optionsHtml;

    // Helper function for checking occupied beds
    const checkConflict = async () => {
        const bedVal = bedSelect.value;
        if (!bedVal) {
            if (conflictAlert) conflictAlert.style.display = 'none';
            return;
        }

        // Check if bed is occupied in the target service
        const { data: occupiedTarget } = await supabaseClient
            .from('pacientes')
            .select('nombre, metadata')
            .eq('cama', bedVal)
            .neq('estado_sala', 'de_alta')
            .neq('estado_sala', 'eliminado')
            .eq('user_id', AppState.user.id);

        let isConflicting = false;
        if (occupiedTarget && occupiedTarget.length > 0) {
            for (const occP of occupiedTarget) {
                if (occP.metadata && occP.metadata.location) {
                    if (occP.metadata.location.floor === selectedSrv.floor && 
                        occP.metadata.location.serviceId === selectedSrv.id) {
                        isConflicting = true;
                        break;
                    }
                }
            }
        }

        if (isConflicting) {
            if (conflictAlert) conflictAlert.style.display = 'block';
        } else {
            if (conflictAlert) conflictAlert.style.display = 'none';
        }
    };

    // Run initial check and bind to change event
    await checkConflict();
    bedSelect.onchange = checkConflict;
};

window.confirmTransferPatientAction = async function() {
    if (!currentTransferringPatientId) return;

    const srvSelect = document.getElementById('transferPatientServiceSelect');
    const bedSelect = document.getElementById('transferPatientBedSelect');
    if (!srvSelect || !bedSelect) return;

    const selectedIdx = parseInt(srvSelect.value);
    const selectedSrv = currentAvailableServices[selectedIdx];
    if (!selectedSrv) return;

    let targetBed = bedSelect.value;

    // If conflict alert is visible, warn the user
    const conflictAlert = document.getElementById('transferPatientConflictAlert');
    if (conflictAlert && conflictAlert.style.display === 'block') {
        const proceed = confirm("La cama seleccionada está ocupada. ¿Deseas trasladar al paciente a 'Cupos del Servicio (Sin Cama)'?");
        if (!proceed) return;
        targetBed = ''; // Clear to send to Cupos
    }

    const newLocation = {
        floor: selectedSrv.floor,
        serviceId: selectedSrv.id,
        name: selectedSrv.name,
        type: currentTransferringPatientType
    };

    // 1. Fetch current patient metadata to extend it
    const { data: p } = await supabaseClient
        .from('pacientes')
        .select('metadata, created_at')
        .eq('id', currentTransferringPatientId)
        .single();

    const nowIso = new Date().toISOString();
    const firstAdmittedAt = p?.metadata?.first_hospital_admitted_at || p?.metadata?.fecha_ingreso_servicio || p?.created_at || nowIso;
    const oldLocation = p?.metadata?.location;
    const transferHistory = Array.isArray(p?.metadata?.transfer_history) ? [...p.metadata.transfer_history] : [];

    if (oldLocation && oldLocation.name) {
        transferHistory.push({
            floor: oldLocation.floor,
            serviceId: oldLocation.serviceId,
            name: oldLocation.name,
            transferred_at: nowIso
        });
    }

    const updatedMetadata = {
        ...(p?.metadata || {}),
        location: newLocation,
        first_hospital_admitted_at: firstAdmittedAt,
        service_admitted_at: nowIso,
        transfer_history: transferHistory
    };

    // 2. Perform DB update
    const { error } = await supabaseClient
        .from('pacientes')
        .update({ 
            cama: targetBed,
            estado_sala: 'activo',
            metadata: updatedMetadata
        })
        .eq('id', currentTransferringPatientId);

    if (!error) {
        showToast(`✅ Paciente trasladado a ${selectedSrv.name} (Cama: ${targetBed || 'Cupos'})`);
        window.closeTransferPatientModal();
        await window.renderWardBedsGrid();
    } else {
        alert("Error al realizar el traslado: " + error.message);
    }
};

window.addBedToActiveService = async function() {
    const txtNewBedName = document.getElementById('txtNewBedName');
    const newBedName = txtNewBedName ? txtNewBedName.value.trim() : '';
    if (!newBedName) return;

    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) return;
    const activeLoc = JSON.parse(activeLocStr);
    const locationKey = `HRA-${activeLoc.floor}-${activeLoc.serviceId}`;

    // Fetch existing configuration
    let { data: configRecord } = await supabaseClient.from('config_camas').select('*').eq('location_key', locationKey).maybeSingle();
    let bedsList = configRecord ? configRecord.beds : getDefaultBeds(activeLoc.floor, activeLoc.serviceId);

    if (bedsList.includes(newBedName)) {
        alert("La cama ya existe en este servicio.");
        return;
    }

    bedsList.push(newBedName);

    // Save back to Supabase config_camas
    let saveError;
    if (configRecord) {
        const { error: updErr } = await supabaseClient.from('config_camas').update({ beds: bedsList, updated_at: new Date() }).eq('id', configRecord.id);
        saveError = updErr;
    } else {
        const { error: insErr } = await supabaseClient.from('config_camas').insert([{ location_key: locationKey, beds: bedsList }]);
        saveError = insErr;
    }

    if (!saveError) {
        showToast(`✅ Cama "${newBedName}" agregada.`);
        if (txtNewBedName) txtNewBedName.value = '';
        await window.renderWardBedsGrid();
    } else {
        alert("Error al guardar configuración de cama: " + saveError.message);
    }
};

window.removeBedFromService = async function(bedName) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la cama "${bedName}" de este servicio?`)) return;

    const activeLocStr = localStorage.getItem('activeLocation');
    if (!activeLocStr) return;
    const activeLoc = JSON.parse(activeLocStr);
    const locationKey = `HRA-${activeLoc.floor}-${activeLoc.serviceId}`;

    let { data: configRecord } = await supabaseClient.from('config_camas').select('*').eq('location_key', locationKey).maybeSingle();
    let bedsList = configRecord ? configRecord.beds : getDefaultBeds(activeLoc.floor, activeLoc.serviceId);

    bedsList = bedsList.filter(b => b !== bedName);

    let saveError;
    if (configRecord) {
        const { error: updErr } = await supabaseClient.from('config_camas').update({ beds: bedsList, updated_at: new Date() }).eq('id', configRecord.id);
        saveError = updErr;
    } else {
        const { error: insErr } = await supabaseClient.from('config_camas').insert([{ location_key: locationKey, beds: bedsList }]);
        saveError = insErr;
    }

    if (!saveError) {
        showToast(`✅ Cama "${bedName}" eliminada.`);
        await window.renderWardBedsGrid();
    } else {
        alert("Error al eliminar cama: " + saveError.message);
    }
};











// =========================================================================
// NEW V4.95: RTH COMPARATOR MODAL & RTH MINERALS HANDLERS
// =========================================================================
window.openRTHComparison = () => {
    const modal = document.getElementById('rthComparisonModal');
    if (modal) modal.classList.add('active');
    
    // Set custom volume input to current daily volume of RTH if it exists
    const rate = parseFloat(document.getElementById('infusionRate')?.value) || 0;
    const volInput = document.getElementById('txtRTHCompVolume');
    if (volInput) {
        volInput.value = rate > 0 ? (rate * 24) : 1000;
    }
    
    window.updateRTHComparisonTable();
};

window.closeRTHComparison = () => {
    const modal = document.getElementById('rthComparisonModal');
    if (modal) modal.classList.remove('active');
};

window.updateRTHComparisonTable = () => {
    const tableBody = document.getElementById('rthComparisonTableBody');
    if (!tableBody) return;
    
    const compVol = parseFloat(document.getElementById('txtRTHCompVolume')?.value) || 1000;
    const rthList = AppState.formulas.filter(f => f.cat === "Fórmulas RTH");
    
    let html = '';
    rthList.forEach(f => {
        const factor = compVol / 100;
        const totalK = f.k * factor;
        const totalP = f.p * factor;
        const totalC = f.c * factor;
        const totalF = f.f * factor;
        
        html += `
            <tr style="border-bottom:1px solid #e2e8f0; height:38px;">
                <td style="padding:8px 10px; text-align:left; font-weight:700; color:#1e293b; position:sticky; left:0; background:white;">${f.name}</td>
                <td style="padding:8px 10px; color:#475569;">${f.volBase} ml</td>
                <td style="padding:8px 10px; background:#fff5f5; color:#c53030; font-weight:600;">${f.k.toFixed(1)}</td>
                <td style="padding:8px 10px; background:#ebf8ff; color:#2b6cb0; font-weight:600;">${f.p.toFixed(1)}</td>
                <td style="padding:8px 10px; background:#f0fff4; color:#22543d; font-weight:600;">${f.c.toFixed(1)}</td>
                <td style="padding:8px 10px; background:#fffaf0; color:#744210; font-weight:600;">${f.f.toFixed(1)}</td>
                <td style="padding:8px 10px; font-weight:800; color:#1e1b4b; border-left:1px solid #e2e8f0; background:#f8fafc;">${Math.round(totalK)}</td>
                <td style="padding:8px 10px; font-weight:800; color:#1e1b4b; background:#f8fafc;">${totalP.toFixed(1)}g</td>
                <td style="padding:8px 10px; font-weight:800; color:#1e1b4b; background:#f8fafc;">${totalC.toFixed(1)}g</td>
                <td style="padding:8px 10px; font-weight:800; color:#1e1b4b; background:#f8fafc;">${totalF.toFixed(1)}g</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
};

window.toggleRTHMinerals = () => {
    const panel = document.getElementById('rthMineralsPanel');
    if (!panel) return;
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        const rate = parseFloat(document.getElementById('infusionRate')?.value) || 0;
        const rthId = document.getElementById('infusionRTHSelect')?.value;
        if (rate > 0 && rthId) {
            const rthObj = AppState.formulas.find(f => f.id === rthId);
            if (rthObj) {
                window.renderRTHMinerals(rthObj, rate * 24);
            }
        }
    }
};

window.renderRTHMinerals = (rthObj, vol) => {
    const grid = document.getElementById('rthMineralsGrid');
    if (!grid) return;
    
    if (!rthObj.minerals || Object.keys(rthObj.minerals).length === 0) {
        grid.innerHTML = `<div style="color:#7f8c8d; grid-column: 1 / -1; padding:10px;">Sin datos de minerales para ${rthObj.name}</div>`;
        return;
    }
    
    const factor = vol / 100;
    const items = [
        { id: "na", name: "Sodio", icon: "🧂" },
        { id: "k", name: "Potasio", icon: "🍌" },
        { id: "cl", name: "Cloro", icon: "🧪" },
        { id: "ca", name: "Calcio", icon: "🦴" },
        { id: "p", name: "Fósforo", icon: "🐟" },
        { id: "mg", name: "Magnesio", icon: "🥬" },
        { id: "fe", name: "Hierro", icon: "🩸" },
        { id: "zn", name: "Zinc", icon: "🛡️" },
        { id: "cu", name: "Cobre", icon: "⚡" },
        { id: "i", name: "Yodo", icon: "🌊" },
        { id: "mn", name: "Manganeso", icon: "🌰" },
        { id: "se", name: "Selenio", icon: "🌾" },
        { id: "cr", name: "Cromo", icon: "💎" },
        { id: "mo", name: "Molibdeno", icon: "⚙️" }
    ];
    
    grid.innerHTML = items.map(i => {
        const val = rthObj.minerals[i.id];
        if (val === undefined) return "";
        const finalVal = (val * factor).toFixed(2).replace('.', ',');
        return `
            <div style="background:#fff; border:1px solid #fadbd8; border-radius:6px; padding:4px; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:50px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <span style="font-size:0.75rem;">${i.icon}</span>
                <span style="font-weight:800; color:#c0392b; margin:1px 0; font-size:0.7rem; white-space:nowrap;">${finalVal} mg</span>
                <span style="font-size:0.55rem; color:#7f8c8d; text-transform:uppercase; font-weight:700;">${i.name}</span>
            </div>
        `;
    }).join('');
};

// Automatic Global Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof initGlobalEvents === 'function') initGlobalEvents();
    });
} else {
    if (typeof initGlobalEvents === 'function') initGlobalEvents();
}
