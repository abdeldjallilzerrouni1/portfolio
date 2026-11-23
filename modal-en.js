window.MODAL_HTML_EN = {
  modalPoteyage: `
<div class="modal-header">
        <h2>Carbon coating machine on a Cartesian gantry</h2>
        <div class="modal-tags">
          <span class="projet-tag">B&amp;R Automation Studio</span>
          <span class="projet-tag">Structured Text</span>
          <span class="projet-tag">GRAFCET</span>
          <span class="projet-tag">Automation</span>
        </div>
      </div>

      <!-- ÉNONCÉ DU PROJET -->
      <div class="modal-section">
        <h3><i class="fas fa-file-pdf"></i> Project brief</h3>
        <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-bottom:0.5rem;">
          <iframe src="poteyage_sujet.pdf" style="width:100%;height:600px;border:none;background:#1a1a24;"></iframe>
        </div>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:#707070;">
          <a href="poteyage_sujet.pdf" target="_blank" style="color:#60a5fa;"><i class="fas fa-download" style="margin-right:0.4rem;"></i>Download brief (PDF)</a>
        </p>
      </div>

      <!-- DESCRIPTION -->
      <div class="modal-section">
        <h3><i class="fas fa-info-circle"></i> Overview</h3>
        <p>
          I programmed the full automatic cycle of a coating machine that deposits carbon on glass half-molds to make demolding easier. Stepper motors drive a Cartesian gantry that moves the molds over a fixed burner along a set scan pattern.
        </p>
        <p style="margin-top: 1rem;">
          I defined the cycle parameters, drew the control GRAFCET, wrote the logic in Structured Text, and checked everything in simulation before testing on the real machine.
        </p>
      </div>

      <!-- FONCTION -->
      <div class="modal-section">
        <h3><i class="fas fa-cog"></i> What the program does</h3>
        <p style="margin-bottom: 0.75rem;">The software runs the entire coating cycle:</p>
        <ul>
          <li>Initialization and homing of X and Y axes</li>
          <li>Positioning at the start point (deltaX, deltaY)</li>
          <li>Zigzag scanning of the treatment zone</li>
          <li>Synchronization of X and Y motion with alternating up/down travel</li>
          <li>Flame management (ignition at start, shutoff at end of cycle)</li>
          <li>Automatic return to initial position</li>
        </ul>
        <p style="margin-top: 0.75rem;">The code handles scan loops that alternate vertical moves during horizontal advance to ensure complete, uniform surface coverage.</p>
      </div>

      <!-- CODE -->
      <div class="modal-section">
        <h3><i class="fas fa-code"></i> Code source (Structured Text)</h3>
        <div class="code-tabs">
          <button class="code-tab active" onclick="switchCodeTab(this, 'poteyage-main')">Program (Main.st)</button>
          <button class="code-tab" onclick="switchCodeTab(this, 'poteyage-var')">Local variables</button>
          <button class="code-tab" onclick="switchCodeTab(this, 'poteyage-gvar')">Global variables</button>
          <button class="code-tab" onclick="switchCodeTab(this, 'poteyage-typ')">Global types</button>
        </div>

        <div class="code-panel active" id="poteyage-main">
          <pre>PROGRAM _INIT
    // Initialisation des variables sans valeur par defaut
    aNom := 10.0;  // Acceleration nominale [mm/s^2]
    vNom := 20.0;  // Vitesse nominale [mm/s]

    // Initialisation des parametres du cycle de poteyage
    a := 250.0;     // Longueur du moule [mm]
    b := 120.0;     // Largeur du moule [mm]
    pas := 30.0;    // Pas de balayage [mm]
    deltaX := 10.0; // Decalage initial axe X [mm]
    deltaY := 10.0; // Decalage initial axe Y [mm]

    // Initialisation des positions et compteur
    posX := 0.0;
    posY := 0.0;
    i := 0;

    // Initialisation variables detection front montant
    ihm_start_prev := FALSE;

    // Initialisation flamme
    Flamme := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
    // ============================================
    // LEGENDE DES COMMANDES ET INFORMATIONS :
    // COMMANDES (Cmd_X, Cmd_Y) :
    //   BpOn = Allumer/activer l'axe (mise sous tension)
    //   BpHome = Demander homing (recherche de l'origine)
    //   MoveAbsolute.Acc = Definir l'acceleration du mouvement
    //   MoveAbsolute.Vit = Definir la vitesse du mouvement
    //   MoveAbsolute.Pos = Definir la position destination
    //   MoveAbsolute.BpMove = Demarrer le mouvement
    // INFORMATIONS (Info_X, Info_Y) :
    //   PowerOn = L'axe est alimente/sous tension
    //   IsHomed = L'axe a termine le homing
    //   Standstill = L'axe est arrete (arrive a destination)
    // ============================================

    // Logique normale du grafcet
    CASE etat OF
        0: // ETAT 0 : Attente bouton ON
            IF ihm_on THEN
                etat := 1;
                Cmd_X.BpOn := TRUE;
                Cmd_Y.BpOn := TRUE;
            END_IF

        1: // ETAT 1 : Attente alimentation des axes
            IF Info_X.PowerOn AND Info_Y.PowerOn THEN
                etat := 2;
            END_IF

        2: // ETAT 2 : Attente bouton HOME
            IF ihm_home THEN
                ihm_home := FALSE;
                Cmd_X.BpHome := TRUE;
                Cmd_Y.BpHome := TRUE;
                etat := 3;
            END_IF

        3: // ETAT 3 : Attente fin du homing
            IF Info_X.Standstill AND Info_Y.Standstill
               AND Info_X.IsHomed AND Info_Y.IsHomed THEN
                posX := 0.0;
                posY := 0.0;
                etat := 4;
            END_IF

        4: // ETAT 4 : Attente bouton START
            Cmd_X.MoveAbsolute.BpMove := FALSE;
            Cmd_Y.MoveAbsolute.BpMove := FALSE;

            IF NOT ihm_on THEN
                etat := 5;
                Cmd_X.BpOn := FALSE;
                Cmd_Y.BpOn := FALSE;
            ELSIF ihm_start AND NOT ihm_start_prev THEN
                IF posX = 0.0 AND posY = 0.0 THEN
                    // Lancer le cycle de poteyage
                    Flamme := TRUE;
                    posX := deltaX;
                    posY := deltaY;
                    Cmd_X.MoveAbsolute.Acc := aNom;
                    Cmd_X.MoveAbsolute.Vit := vNom;
                    Cmd_X.MoveAbsolute.Pos := posX;
                    Cmd_X.MoveAbsolute.BpMove := TRUE;
                    Cmd_Y.MoveAbsolute.Acc := aNom;
                    Cmd_Y.MoveAbsolute.Vit := vNom;
                    Cmd_Y.MoveAbsolute.Pos := posY;
                    Cmd_Y.MoveAbsolute.BpMove := TRUE;
                    etat := 10;
                ELSE
                    // Retour a l'origine
                    Flamme := FALSE;
                    posX := 0.0;
                    posY := 0.0;
                    Cmd_X.MoveAbsolute.Pos := posX;
                    Cmd_X.MoveAbsolute.BpMove := TRUE;
                    Cmd_Y.MoveAbsolute.Pos := posY;
                    Cmd_Y.MoveAbsolute.BpMove := TRUE;
                    etat := 4;
                END_IF
            END_IF
            ihm_start_prev := ihm_start;

        5: // ETAT 5 : Arret/Redemarrage des axes
            IF NOT Info_X.PowerOn AND NOT Info_Y.PowerOn THEN
                IF ihm_on THEN
                    etat := 1;
                    Cmd_X.BpOn := TRUE;
                    Cmd_Y.BpOn := TRUE;
                END_IF
            ELSIF Info_X.PowerOn AND Info_Y.PowerOn THEN
                etat := 4;
            END_IF

        10: // ETAT 10 : Arrivee position de depart (10,10)
            IF Info_X.Standstill AND Info_Y.Standstill THEN
                Cmd_X.MoveAbsolute.BpMove := FALSE;
                Cmd_Y.MoveAbsolute.BpMove := FALSE;
                posY := deltaY + a;  // 10 + 250 = 260mm
                Cmd_Y.MoveAbsolute.Pos := posY;
                Cmd_Y.MoveAbsolute.BpMove := TRUE;
                etat := 11;
            END_IF

        11: // ETAT 11 : Y monte vers 260mm
            IF Info_Y.Standstill THEN
                Cmd_Y.MoveAbsolute.BpMove := FALSE;
                IF posX &gt;= (deltaX + 3.0 * b) THEN
                    // Fin balayage : Y descend a 10mm
                    posY := deltaY;
                    Cmd_Y.MoveAbsolute.Pos := posY;
                    Cmd_Y.MoveAbsolute.BpMove := TRUE;
                    etat := 13;
                ELSE
                    // X avance de +30mm
                    posX := posX + pas;
                    Cmd_X.MoveAbsolute.Pos := posX;
                    Cmd_X.MoveAbsolute.BpMove := TRUE;
                    etat := 12;
                END_IF
            END_IF

        12: // ETAT 12 : X se deplace vers la droite
            IF Info_X.Standstill THEN
                Cmd_X.MoveAbsolute.BpMove := FALSE;
                IF posX &gt;= (deltaX + 3.0 * b) THEN
                    IF posY &gt;= (deltaY + a - 1.0) THEN
                        posY := deltaY;
                        Cmd_Y.MoveAbsolute.Pos := posY;
                        Cmd_Y.MoveAbsolute.BpMove := TRUE;
                        etat := 13;
                    ELSE
                        etat := 14;
                    END_IF
                ELSE
                    IF posY &gt;= (deltaY + a - 1.0) THEN
                        posY := deltaY;
                        Cmd_Y.MoveAbsolute.Pos := posY;
                        Cmd_Y.MoveAbsolute.BpMove := TRUE;
                        etat := 13;
                    ELSE
                        posY := deltaY + a;
                        Cmd_Y.MoveAbsolute.Pos := posY;
                        Cmd_Y.MoveAbsolute.BpMove := TRUE;
                        etat := 11;
                    END_IF
                END_IF
            END_IF

        13: // ETAT 13 : Y descend vers 10mm
            IF Info_Y.Standstill THEN
                Cmd_Y.MoveAbsolute.BpMove := FALSE;
                IF posX &gt;= (deltaX + 3.0 * b) THEN
                    etat := 14;
                ELSE
                    posX := posX + pas;
                    Cmd_X.MoveAbsolute.Pos := posX;
                    Cmd_X.MoveAbsolute.BpMove := TRUE;
                    etat := 12;
                END_IF
            END_IF

        14: // ETAT 14 : Fin du balayage
            Cmd_X.MoveAbsolute.BpMove := FALSE;
            Cmd_Y.MoveAbsolute.BpMove := FALSE;
            etat := 4;
    END_CASE;

END_PROGRAM</pre>
        </div>

        <div class="code-panel" id="poteyage-var">
          <pre>(* ============================================ *)
(* PARAMETRES DE MOUVEMENT                     *)
(* ============================================ *)
VAR
    aNom : REAL;           (* Acceleration nominale en mm/s² *)
    vNom : REAL;           (* Vitesse nominale en mm/s *)
    dest : REAL;           (* Destination sur x [mm] *)

    (* BOUTONS DE L'INTERFACE (ENTREES) *)
    ihm_on : BOOL;         (* Bouton ON : demarrage machine *)
    ihm_start : BOOL;      (* Bouton START : depart du cycle *)
    ihm_home : BOOL;       (* Bouton HOME : prise d'origine *)

    (* ETAT DU GRAPHCET *)
    etat : USINT;          (* Numero de l'etat actuel *)

    (* DETECTION FRONT MONTANT *)
    ihm_start_prev : BOOL; (* Memoire etat precedent START *)

    (* GESTION FLAMME *)
    Flamme : BOOL;         (* TRUE = allumee, FALSE = eteinte *)

    (* PARAMETRES DU CYCLE *)
    a : REAL;              (* Longueur du moule [mm] *)
    b : REAL;              (* Largeur du moule [mm] *)
    pas : REAL;            (* Pas de balayage [mm] *)
    deltaX : REAL;         (* Decalage initial axe X [mm] *)
    deltaY : REAL;         (* Decalage initial axe Y [mm] *)

    (* VARIABLES DE POSITION *)
    posX : REAL;           (* Position courante axe X [mm] *)
    posY : REAL;           (* Position courante axe Y [mm] *)
    i : USINT;             (* Compteur de cycles *)
END_VAR</pre>
        </div>

        <div class="code-panel" id="poteyage-gvar">
          <pre>(* ============================================ *)
(* Variables globales du projet charlyRobot_sdc *)
(* ============================================ *)
VAR
    gAxis04 : ACP10AXIS_typ := (0);
    gAxis04_HW : SdcHwCfg_typ := (0);
    gAxis04_DrvIf : SdcDrvIf16_typ := (0);
    gAxis04_EncIf1 : SdcEncIf16_typ := (0);
    gAxis04_DiDoIf : SdcDiDoIf_typ := (0);
    gAxis04_MotorStep0 : INT := 0;

    gAxis05 : ACP10AXIS_typ := (0);
    gAxis05_HW : SdcHwCfg_typ := (0);
    gAxis05_DrvIf : SdcDrvIf16_typ := (0);
    gAxis05_EncIf1 : SdcEncIf16_typ := (0);
    gAxis05_DiDoIf : SdcDiDoIf_typ := (0);
    gAxis05_MotorStep0 : INT := 0;

    gAxis06 : ACP10AXIS_typ := (0);
    gAxis06_HW : SdcHwCfg_typ := (0);
    gAxis06_DrvIf : SdcDrvIf16_typ := (0);
    gAxis06_EncIf1 : SdcEncIf16_typ := (0);
    gAxis06_DiDoIf : SdcDiDoIf_typ := (0);
    gAxis06_MotorStep0 : INT := 0;

    (* Structures de commande et d'information des axes *)
    Cmd_X : RbTrAxeCmd_typ;
    Cmd_Y : RbTrAxeCmd_typ;
    Cmd_Z : RbTrAxeCmd_typ;
    Info_X : RbTrAxeInfo_typ;
    Info_Y : RbTrAxeInfo_typ;
    Info_Z : RbTrAxeInfo_typ;
END_VAR</pre>
        </div>

        <div class="code-panel" id="poteyage-typ">
          <pre>(* ============================================ *)
(* Types globaux du projet charlyRobot_sdc     *)
(* ============================================ *)
TYPE
    dessin_state_enum :
        (
        dessin_DORMANT,          (* Attente init axes et BpOn *)
        dessin_POWER_ON,         (* Demarrage des axes *)
        dessin_POWER_OFF,        (* Arret des axes *)
        dessin_HOME,             (* Prises d'origines *)
        dessin_MOVEUP_FROM_H,
        dessin_MOVEUP_FROM_H1,
        dessin_USER_ACTION,      (* Attente choix action *)
        dessin_LOAD,             (* Chargement fichier dessin *)
        dessin_ENTER_MODE_ABS,   (* Mode pilotage absolu *)
        dessin_EXIT_MODE_ABS,    (* Sortie mode absolu *)
        dessin_USER_START,       (* Attente depart trace *)
        dessin_MOVEABS,          (* Deplacement vers premier point *)
        dessin_MOVEDOWN,         (* Descente outil *)
        dessin_MOVESPLINE,       (* Trace ligne *)
        dessin_MOVESPLINE1,      (* Trace ligne *)
        dessin_MOVEUP,           (* Remontee outil *)
        dessin_EXIT_MODE_CYCLIC,
        dessin_EXIT_MODE_CYCLIC1,
        dessin_EXIT_MODE_ABS_TO_UA,
        dessin_MOVEREF,
        dessin_MOVEREF1,
        dessin_MOVEREF2,
        dessin_ERROR,
        dessin_RESETTING
        );

    DefSpline_state_enum :
        (
        defSpl_DORMANT,
        defSpl_ENABLING,
        defSpl_EXECUTING,
        defSpl_DONE,
        defSpl_ERROR,
        defSpl_RESETTING
        );
END_TYPE</pre>
        </div>
      </div>

      <!-- CHRONOGRAMME -->
      <div class="modal-section">
        <h3><i class="fas fa-chart-line"></i> Timing diagram analysis</h3>
        <div class="chrono-container">
          <img src="poteyage_chrono.png" alt="Carbon-coating cycle timing diagrams">
        </div>
        <p>The timing diagrams show consistent cycle operation:</p>
        <ul>
          <li><strong>X velocity</strong> — acceleration / constant speed / deceleration cycles corresponding to horizontal motion</li>
          <li><strong>Y velocity</strong> — alternating up / stop / down corresponding to vertical zigzag scanning</li>
        </ul>
        <p style="margin-top: 0.75rem;">The curves confirm that the trajectory respects the scan pitch and the programmed strategy.</p>
      </div>

      <!-- VIDEO -->
      <div class="modal-section">
        <h3><i class="fas fa-video"></i> Experimental validation</h3>
        <div class="video-container">
          <video controls preload="metadata">
            <source src="poteyage_video.mp4" type="video/mp4">
            Your browser does not support video playback.
          </video>
        </div>
        <p>Proper system operation was verified experimentally by replacing the burner with a felt marker and using a white sheet to trace the trajectory. The resulting trace confirms that actual motion matches the programmed theoretical path and validates the automated cycle.</p>
      </div>
`,
  modalRidoir: `
<div class="modal-header">
        <h2>Hydraulic spreader — Redesign and welded-fabrication optimization</h2>
        <div class="modal-tags">
          <span class="projet-tag">SolidWorks</span>
          <span class="projet-tag">Simulation FEA</span>
          <span class="projet-tag">Welded design</span>
          <span class="projet-tag">Optimization</span>
        </div>
      </div>

      <!-- ÉNONCÉ DU PROJET -->
      <div class="modal-section">
        <h3><i class="fas fa-file-pdf"></i> Project brief</h3>
        <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-bottom:0.5rem;">
          <iframe src="ridoir_sujet.pdf" style="width:100%;height:600px;border:none;background:#1a1a24;"></iframe>
        </div>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:#707070;">
          <a href="ridoir_sujet.pdf" target="_blank" style="color:#60a5fa;"><i class="fas fa-download" style="margin-right:0.4rem;"></i>Download brief (PDF)</a>
        </p>
      </div>

      <!-- OBJECTIF -->
      <div class="modal-section">
        <h3><i class="fas fa-bullseye"></i> Goal</h3>
        <p>I redesigned a hydraulic spreader that was hard to build, aiming for a simpler welded version that would be lighter and easier to produce in series—then checked strength in simulation.</p>
      </div>

      <!-- ANALYSE INITIALE -->
      <div class="modal-section">
        <h3><i class="fas fa-search"></i> Initial analysis and modeling</h3>
        <p>Work began with a complete review of a technical drawing to understand the part geometry, mechanical functions, and constraints. A full 3D model was then created in SolidWorks.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="ridoir_3d_initial.png" alt="3D model of the original part">
            <div class="modal-img-caption">3D model of the original part</div>
          </div>
        </div>
        <div class="modal-img-grid single" style="margin-top:1rem;">
          <div class="modal-img-container">
            <img src="ridoir_plan.png" alt="Technical drawing with sections and views" style="width:100%;">
            <div class="modal-img-caption">Technical drawing — sections and views</div>
          </div>
        </div>
      </div>

      <!-- NOUVELLE CONCEPTION -->
      <div class="modal-section">
        <h3><i class="fas fa-pencil-ruler"></i> New welded-fabrication design</h3>
        <p>The part was then rethought for welded fabrication. The design was simplified by breaking the part into several simple machined elements assembled by welding. A new architecture was proposed to eliminate certain complex machined shapes.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="ridoir_new_design.png" alt="New welded-fabrication design">
            <div class="modal-img-caption">3D view of the new welded-fabrication design</div>
          </div>
        </div>
      </div>

      <!-- SOUDURES -->
      <div class="modal-section">
        <h3><i class="fas fa-fire"></i> Weld zone definition</h3>
        <p>The welded assembly was then defined by specifying weld bead zones to ensure rigidity and mechanical continuity of the part.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="ridoir_soudures.png" alt="Weld zones">
            <div class="modal-img-caption">Weld bead locations (red zones)</div>
          </div>
        </div>
      </div>

      <!-- SIMULATION -->
      <div class="modal-section">
        <h3><i class="fas fa-chart-area"></i> Finite element simulation validation</h3>
        <p>Mechanical validation was performed using finite element simulation to verify part strength under load. This analysis identified critical zones, mainly around the mounting holes.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="ridoir_simulation.png" alt="Von Mises simulation">
            <div class="modal-img-caption">Von Mises stress simulation — critical zone visible</div>
          </div>
        </div>
      </div>

      <!-- OPTIMISATION -->
      <div class="modal-section">
        <h3><i class="fas fa-weight-hanging"></i> Mass optimization</h3>
        <p>The part was then optimized to reduce mass while preserving mechanical performance. Several geometric changes achieved significant weight reduction.</p>
        <div class="modal-img-grid" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="ridoir_masse_avant.png" alt="Original part mass">
            <div class="modal-img-caption">Original part — 722.71 g</div>
          </div>
          <div class="modal-img-container">
            <img src="ridoir_masse_apres.png" alt="Optimized part mass">
            <div class="modal-img-caption">Optimized part — 491.02 g</div>
          </div>
        </div>
        <div class="modal-result-box">
          <div class="result-row">
            <span>Initial mass</span>
            <span>~723 g</span>
          </div>
          <div class="result-row">
            <span>Optimized mass</span>
            <span>~491 g</span>
          </div>
          <div class="result-row highlight">
            <span>Mass savings</span>
            <span>~232 g (−32%)</span>
          </div>
        </div>
      </div>

      <!-- VALIDATION PIÈCE OPTIMISÉE -->
      <div class="modal-section">
        <h3><i class="fas fa-chart-area"></i> Validation of the optimized part</h3>
        <p>A second finite element simulation was run on the optimized part to verify that weight reduction did not compromise mechanical strength. Results show that maximum Von Mises stress reaches about <strong>296 MPa</strong>, very close to the material yield limit (<strong>283 MPa</strong>). The part therefore withstands the applied loads but is at the limit of its capacity — confirming that optimization was pushed to the material's full potential.</p>
        <p style="margin-top:0.75rem;">Critical zones remain localized around mounting holes, where stress concentrations are highest due to geometry.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="ridoir_simulation_opti.png" alt="Von Mises simulation optimized part">
            <div class="modal-img-caption">Von Mises simulation — optimized part (max stress ≈ 296 MPa, yield limit ≈ 283 MPa)</div>
          </div>
        </div>
      </div>

      <!-- RÉSULTAT FINAL -->
      <div class="modal-section">
        <h3><i class="fas fa-check-circle"></i> Final result</h3>
        <p>The project produced an optimized welded-fabrication part that is lighter and suited to industrial production, while maintaining mechanical strength validated by simulation.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="ridoir_final.png" alt="Final optimized part">
            <div class="modal-img-caption">3D view of the final optimized part</div>
          </div>
        </div>
      </div>
`,
  modalCNC: `
<div class="modal-header">
        <h2>CNC programming — Complete machining on Heidenhain iTNC 530</h2>
        <div class="modal-tags">
          <span class="projet-tag">SolidWorks</span>
          <span class="projet-tag">Heidenhain iTNC 530</span>
          <span class="projet-tag">Klartext</span>
          <span class="projet-tag">CNC</span>
          <span class="projet-tag">CAD/CAM</span>
        </div>
      </div>

      <!-- OBJECTIF -->
      <div class="modal-section">
        <h3><i class="fas fa-bullseye"></i> Goal</h3>
        <p>I wrote a full machining program for a 150×100 mm part on the Heidenhain iTNC 530. After modeling the part in SolidWorks, I picked four tools for contouring, pockets, slots, and drilling, tuned speeds and feeds for each, and verified the program in simulation.</p>
      </div>

      <!-- MODÉLISATION 3D -->
      <div class="modal-section">
        <h3><i class="fas fa-cube"></i> 3D modeling in SolidWorks</h3>
        <p>The first step was to model the complete part in 3D in SolidWorks to define precisely all geometries to be machined: the outer contour with fillets and chamfers, circular and rectangular pockets, inclined and crossing slots, and holes.</p>
        <div class="modal-img-grid" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="cnc_3d_iso.png" alt="3D model isometric view">
            <div class="modal-img-caption">Isometric view of the part</div>
          </div>
          <div class="modal-img-container">
            <img src="cnc_3d_top.png" alt="3D model top view">
            <div class="modal-img-caption">Top view</div>
          </div>
        </div>
      </div>

      <!-- MISE EN PLAN -->
      <div class="modal-section">
        <h3><i class="fas fa-drafting-compass"></i> Dimensioned engineering drawing</h3>
        <p>A complete drawing was then produced with all dimensions required for CNC programming: overall dimensions (150×100 mm), pocket center positions, hole diameters, machining depths, and section B-B showing the cross-section profile.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="cnc_plan.png" alt="Dimensioned drawing" style="width:100%;">
            <div class="modal-img-caption">Complete drawing — Section B-B and dimensioned top view</div>
          </div>
        </div>
      </div>

      <!-- SÉLECTION DES OUTILS -->
      <div class="modal-section">
        <h3><i class="fas fa-tools"></i> Tool selection</h3>
        <p>Four tools were selected with optimized technological parameters:</p>
        <ul>
          <li><code style="color:#60a5fa;">Tool call 8 Z s2000 F200.</code> — Contouring end mill, used for the outer contour of the part</li>
          <li><code style="color:#60a5fa;">Tool call 5 Z s2000 F300.</code> — Pocket and slot end mill, used for circular and rectangular pockets and slots</li>
          <li><code style="color:#60a5fa;">Tool call 4 Z1300 F300.</code> — Main drill, used for polar pattern drilling (4 holes)</li>
          <li><code style="color:#60a5fa;">Tool call 41 Z1300 F300.</code> — Small-diameter drill, used for single-hole drilling</li>
        </ul>
      </div>

      <!-- PROGRAMME CNC -->
      <div class="modal-section">
        <h3><i class="fas fa-code"></i> CNC program (Heidenhain Klartext — 62 lines)</h3>
        <p style="margin-bottom:0.75rem;">The complete program covers the following operations: outer contouring, circular pocket (CYCL 252), rectangular pocket (CYCL 251), inclined slot (CYCL 253), polar pattern drilling (CYCL 200 + CYCL 220), single-hole drilling, crossing slots, and central circular pocket.</p>
        <div class="code-tabs">
          <button class="code-tab active" onclick="switchCodeTab(this, 'cnc-full')">Full program</button>
        </div>
        <div class="code-panel active" id="cnc-full">
          <pre>0 BEGIN PGM project MM
1 BLK FORM 0.1 Z X+0 Y+0 Z-20
2 BLK FORM 0.2 X+150 Y+100 Z+0

; ===== CONTOURNAGE EXTERIEUR (Outil 8) =====
3 TOOL CALL 8 Z S2000 F200
4 L Z+100 RO FMAX M3
5 L X+5 Y-20 RL
6 L Z-5
7 L X+5 Y+95
8 RND R8
9 L X+135 Y+95
10 CR X+145 Y+80 R+20 DR-
11 L X+145 Y+24
12 CT X+136 Y+9
13 L X+128.5 Y+5
14 L X+35.5
15 L Y+15
16 CC X+26.5 Y+25
17 C X+17.5 Y+15 DR+
18 L Y+5
19 L X+11
20 L X+5 Y+11
21 L X-20
22 L Z+50 FMAX
23 ;

; ===== POCHES ET RAINURES (Outil 5) =====
24 TOOL CALL 5 Z S2000 F300
25 L Z+50 RO FMAX M3
26 ;
27 L X+125 Y+30
28 CYCL DEF 252 CIRCULAR POCKET
    Q215=0   ; MACHINING OPERATION
    Q223=+20 ; CIRCLE DIAMETER
    Q368=+0  ; ALLOWANCE FOR SIDE
    Q207=AUTO ; FEED RATE FOR MILLING
    Q351=1   ; CLIMB OR UP-CUT
    Q201=-3  ; DEPTH
    Q202=+5  ; PLUNGING DEPTH
    Q369=+0  ; ALLOWANCE FOR FLOOR
    Q206=AUTO ; FEED RATE FOR PLUNGING
    Q338=0   ; INFEED FOR FINISHING
    Q200=+5  ; SET-UP CLEARANCE
    Q203=+0  ; SURFACE COORDINATE
    Q204=+50 ; 2ND SET-UP CLEARANCE
    Q370=0.8 ; TOOL PATH OVERLAP
    Q366=+1  ; PLUNGE
    Q385=AUTO ; FINISHING FEED RATE
29 CYCL CALL
30 ;

31 CYCL DEF 251 RECTANGULAR POCKET
    Q215=0   ; MACHINING OPERATION
    Q218=+30 ; FIRST SIDE LENGTH
    Q367=+0  ; ANGLE OF ROTATION
    Q207=AUTO ; FEED RATE FOR MILLING
    Q351=1   ; CLIMB OR UP-CUT
    Q201=-5  ; DEPTH
    Q202=+5  ; PLUNGING DEPTH
    Q369=+0  ; ALLOWANCE FOR FLOOR
    Q206=AUTO ; FEED RATE FOR PLUNGING
    Q338=0   ; INFEED FOR FINISHING
    Q200=+5  ; SET-UP CLEARANCE
    Q203=+0  ; SURFACE COORDINATE
    Q204=+50 ; 2ND SET-UP CLEARANCE
    Q370=0.8 ; TOOL PATH OVERLAP
    Q366=+1  ; PLUNGE
    Q385=AUTO ; FINISHING FEED RATE
32 CYCL CALL
33 ;

34 L X+125 Y+71
35 CYCL DEF 253 SLOT MILLING
    Q215=0   ; MACHINING OPERATION
    Q218=+32 ; SLOT LENGTH
    Q219=+12 ; SLOT WIDTH
    Q368=+0  ; ALLOWANCE FOR SIDE
    Q374=+120 ; ANGLE OF ROTATION
    Q367=+0  ; SLOT POSITION
    Q207=AUTO ; FEED RATE FOR MILLING
    Q351=1   ; CLIMB OR UP-CUT
    Q201=-6  ; DEPTH
    Q202=+5  ; PLUNGING DEPTH
    Q369=+0  ; ALLOWANCE FOR FLOOR
    Q206=AUTO ; FEED RATE FOR PLUNGING
    Q338=0   ; INFEED FOR FINISHING
    Q200=+5  ; SET-UP CLEARANCE
    Q203=+0  ; SURFACE COORDINATE
    Q204=+50 ; 2ND SET-UP CLEARANCE
    Q366=+1  ; PLUNGE
    Q385=AUTO ; FINISHING FEED RATE
36 CYCL CALL POS X+75 Y+50 Z+0
37 ;

; ===== PERCAGE MOTIF POLAIRE (Outil 4) =====
38 TOOL CALL 4 Z S1300 F300
39 CYCL DEF 200 DRILLING
    Q200=+5  ; SET-UP CLEARANCE
    Q201=-20 ; DEPTH
    Q206=AUTO ; FEED RATE FOR PLUNGING
    Q202=+5  ; PLUNGING DEPTH
    Q210=0   ; DWELL TIME AT TOP
    Q203=+0  ; SURFACE COORDINATE
    Q204=+50 ; 2ND SET-UP CLEARANCE
    Q211=0   ; DWELL TIME AT DEPTH
40 CYCL DEF 220 POLAR PATTERN
    Q216=+75 ; CENTER IN 1ST AXIS
    Q217=+50 ; CENTER IN 2ND AXIS
    Q244=+60 ; PITCH CIRCLE DIAMETER
    Q245=+45 ; STARTING ANGLE
    Q246=+360 ; STOPPING ANGLE
    Q247=+90 ; STEPPING ANGLE
    Q241=+4  ; NR OF REPETITIONS
41 CYCL CALL
42 ;

; ===== PERCAGE UNITAIRE (Outil 41) =====
43 TOOL DEF 41
44 TOOL CALL 41 Z S1300 F300
45 L X+12 Y+40
46 CYCL DEF 200 DRILLING
    Q200=+5  ; SET-UP CLEARANCE
    Q201=-10 ; DEPTH
    Q206=AUTO ; FEED RATE FOR PLUNGING
    Q202=+5  ; PLUNGING DEPTH
    Q210=0   ; DWELL TIME AT TOP
    Q203=+0  ; SURFACE COORDINATE
    Q204=+50 ; 2ND SET-UP CLEARANCE
    Q211=0   ; DWELL TIME AT DEPTH
47 CYCL CALL
48 ;
49 ;
50 ;

; ===== RAINURES CROISEES + POCHE CENTRALE (Outil 5) =====
51 TOOL CALL 5 Z S2000 F300
52 CYCL DEF 253 SLOT MILLING
    Q215=0   ; MACHINING OPERATION
    Q218=+70 ; SLOT LENGTH
    Q219=+20 ; SLOT WIDTH
    Q368=+0  ; ALLOWANCE FOR SIDE
    Q374=+90 ; ANGLE OF ROTATION
    Q367=+0  ; SLOT POSITION
    Q207=AUTO ; FEED RATE FOR MILLING
    Q351=1   ; CLIMB OR UP-CUT
    Q201=-5  ; DEPTH
    Q202=+5  ; PLUNGING DEPTH
    Q369=+0  ; ALLOWANCE FOR FLOOR
    Q206=AUTO ; FEED RATE FOR PLUNGING
    Q338=0   ; INFEED FOR FINISHING
    Q200=+5  ; SET-UP CLEARANCE
    Q203=+0  ; SURFACE COORDINATE
    Q204=+50 ; 2ND SET-UP CLEARANCE
    Q366=+1  ; PLUNGE
    Q385=AUTO ; FINISHING FEED RATE
53 CYCL CALL POS X+75 Y+50 Z+0
54 ;

55 CYCL DEF 253 SLOT MILLING
    Q215=0   ; MACHINING OPERATION
    Q218=+70 ; SLOT LENGTH
    Q219=+20 ; SLOT WIDTH
    Q368=+0  ; ALLOWANCE FOR SIDE
    Q374=+0  ; ANGLE OF ROTATION
    Q367=+0  ; SLOT POSITION
    Q207=AUTO ; FEED RATE FOR MILLING
    Q351=1   ; CLIMB OR UP-CUT
    Q201=-5  ; DEPTH
    Q202=+5  ; PLUNGING DEPTH
    Q369=+0  ; ALLOWANCE FOR FLOOR
    Q206=AUTO ; FEED RATE FOR PLUNGING
    Q338=0   ; INFEED FOR FINISHING
    Q200=+5  ; SET-UP CLEARANCE
    Q203=+0  ; SURFACE COORDINATE
    Q204=+50 ; 2ND SET-UP CLEARANCE
    Q366=+1  ; PLUNGE
    Q385=AUTO ; FINISHING FEED RATE
56 CYCL CALL POS X+75 Y+50 Z+0
57 ;

58 L X+75 Y+50 Z+0
59 CYCL DEF 252 CIRCULAR POCKET
    Q215=0   ; MACHINING OPERATION
    Q223=+20 ; CIRCLE DIAMETER
    Q368=+0  ; ALLOWANCE FOR SIDE
    Q207=AUTO ; FEED RATE FOR MILLING
    Q351=1   ; CLIMB OR UP-CUT
    Q201=-8  ; DEPTH
    Q202=+5  ; PLUNGING DEPTH
    Q369=+0  ; ALLOWANCE FOR FLOOR
    Q206=AUTO ; FEED RATE FOR PLUNGING
    Q338=0   ; INFEED FOR FINISHING
    Q200=+5  ; SET-UP CLEARANCE
    Q203=+0  ; SURFACE COORDINATE
    Q204=+50 ; 2ND SET-UP CLEARANCE
    Q370=0.8 ; TOOL PATH OVERLAP
    Q366=+1  ; PLUNGE
    Q385=AUTO ; FINISHING FEED RATE
60 CYCL CALL
61 ;

62 END PGM project MM</pre>
        </div>
      </div>

      <!-- SIMULATION -->
      <div class="modal-section">
        <h3><i class="fas fa-play-circle"></i> Simulation result</h3>
        <p>The program was successfully simulated in the Heidenhain iTNC 530 environment. The simulation confirms that all machining operations execute correctly: the outer contour, pockets, crossing slots, and holes match the geometries defined in the 3D model.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="cnc_simulation.png" alt="CNC simulation result">
            <div class="modal-img-caption">Simulation result — virtually machined part</div>
          </div>
        </div>
      </div>

      <!-- RÉSULTAT -->
      <div class="modal-section">
        <h3><i class="fas fa-check-circle"></i> Final result</h3>
        <p>This assignment walked through CAD, CAM, and CNC end to end: SolidWorks modeling, then Heidenhain Klartext programming with tuned cutting data. The 62-line program mixes contours, round and rectangular pockets, slots, and a bolt circle—and shows how digital tools tighten precision on the shop floor.</p>
      </div>
`,
  modalUsinage: `
<div class="modal-header">
        <h2>Machining fixture — Design for drilling cylindrical parts</h2>
        <div class="modal-tags">
          <span class="projet-tag">SolidWorks</span>
          <span class="projet-tag">Isostatic constraint</span>
          <span class="projet-tag">Workholding</span>
          <span class="projet-tag">Design</span>
        </div>
      </div>

      <!-- ÉNONCÉ -->
      <div class="modal-section">
        <h3><i class="fas fa-file-pdf"></i> Project brief</h3>
        <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-bottom:0.5rem;">
          <iframe src="usinage_sujet.pdf" style="width:100%;height:600px;border:none;background:#1a1a24;"></iframe>
        </div>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:#707070;">
          <a href="usinage_sujet.pdf" target="_blank" style="color:#60a5fa;"><i class="fas fa-download" style="margin-right:0.4rem;"></i>Download brief (PDF)</a>
        </p>
      </div>

      <!-- OBJECTIF -->
      <div class="modal-section">
        <h3><i class="fas fa-bullseye"></i> Goal</h3>
        <p>I designed a fixture to hold a round part for drilling: isostatic locating, easy to make, inexpensive, stiff enough for a pillar drill, and comfortable to use on the shop floor.</p>
      </div>

      <!-- ANALYSE PIÈCE -->
      <div class="modal-section">
        <h3><i class="fas fa-search"></i> Part analysis</h3>
        <p>Work began by analyzing the part definition drawing to identify functional surfaces required for workholding. The part had to be located by resting on the main cylinder, a flat surface, and the lateral faces of the slot to achieve an isostatic fixed constraint.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="usinage_piece.png" alt="Cylindrical part to drill">
            <div class="modal-img-caption">Cylindrical part to drill — hole to be made (dashed)</div>
          </div>
        </div>
      </div>

      <!-- MISE EN POSITION -->
      <div class="modal-section">
        <h3><i class="fas fa-arrows-alt"></i> Workholding — Chamfered slot</h3>
        <p>Workholding was achieved with a slot system to locate the part on its main cylindrical portion. Chamfers were added to improve contact and avoid part damage while enabling quick detection of out-of-tolerance parts.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="usinage_rainure_detail.png" alt="Slot view with part">
            <div class="modal-img-caption">Detailed view — part located in the slot</div>
          </div>
        </div>
        <div class="modal-img-grid single" style="margin-top:1rem;">
          <div class="modal-img-container">
            <img src="usinage_rainure.png" alt="Chamfered slot">
            <div class="modal-img-caption">Chamfered slot</div>
          </div>
        </div>
      </div>

      <!-- BLOCAGE ROTATION -->
      <div class="modal-section">
        <h3><i class="fas fa-lock"></i> Rotation lock</h3>
        <p>An adjustable rotation lock using a knurled screw was added to ensure correct part orientation during drilling.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="usinage_blocage.png" alt="Rotation lock knurled screw">
            <div class="modal-img-caption">Rotation lock with knurled screw</div>
          </div>
        </div>
      </div>

      <!-- SAUTERELLE -->
      <div class="modal-section">
        <h3><i class="fas fa-compress-arrows-alt"></i> Clamping — Toggle clamp</h3>
        <p>Clamping was provided by a horizontal toggle clamp for fast, reliable, ergonomic tightening. This system allows effective clamping while making part loading and quick removal easy.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="usinage_sauterelle.png" alt="Toggle clamp">
            <div class="modal-img-caption">Horizontal toggle clamp</div>
          </div>
        </div>
      </div>

      <!-- ÉLÉMENTS COMPLÉMENTAIRES -->
      <div class="modal-section">
        <h3><i class="fas fa-puzzle-piece"></i> Additional components</h3>
        <p>Additional components were then integrated to ensure proper fixture operation:</p>
        <ul>
          <li>Clearance space for drill passage</li>
          <li>Drill bushing to guide the drill</li>
          <li>Bushing support</li>
          <li>Handle to improve ergonomics</li>
        </ul>
        <div class="modal-img-grid" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="usinage_degagement.png" alt="Drill clearance">
            <div class="modal-img-caption">Clearance space for the drill</div>
          </div>
          <div class="modal-img-container">
            <img src="usinage_canon.png" alt="Drill bushing support">
            <div class="modal-img-caption">Drill bushing support</div>
          </div>
        </div>
        <div class="modal-img-grid single" style="margin-top:1rem;">
          <div class="modal-img-container">
            <img src="usinage_complet.png" alt="Complete fixture with handle">
            <div class="modal-img-caption">Complete fixture with toggle clamp and handle</div>
          </div>
        </div>
      </div>

      <!-- MISE EN PLAN -->
      <div class="modal-section">
        <h3><i class="fas fa-drafting-compass"></i> Final engineering drawing</h3>
        <p>The project concluded with a complete engineering drawing of the machining fixture.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="usinage_plan.png" alt="Machining fixture drawing" style="width:100%;">
            <div class="modal-img-caption">Final drawing of the machining fixture</div>
          </div>
        </div>
      </div>

      <!-- RÉSULTAT FINAL -->
      <div class="modal-section">
        <h3><i class="fas fa-check-circle"></i> Final result</h3>
        <p>The designed fixture enables precise isostatic positioning, fast clamping, and good ease of use. The chosen solution combines mechanical effectiveness, manufacturing simplicity, and cost reduction.</p>
      </div>
`,
  modalMulti: `
<div class="modal-header">
        <h2>Hydraulic pressure intensifier — Casting part design and optimization</h2>
        <div class="modal-tags">
          <span class="projet-tag">SolidWorks</span>
          <span class="projet-tag">Aluminum casting</span>
          <span class="projet-tag">Simulation FEA</span>
          <span class="projet-tag">Optimization</span>
        </div>
      </div>

      <!-- ÉNONCÉ -->
      <div class="modal-section">
        <h3><i class="fas fa-file-pdf"></i> Project brief</h3>
        <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-bottom:0.5rem;">
          <iframe src="multi_sujet.pdf" style="width:100%;height:600px;border:none;background:#1a1a24;"></iframe>
        </div>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:#707070;">
          <a href="multi_sujet.pdf" target="_blank" style="color:#60a5fa;"><i class="fas fa-download" style="margin-right:0.4rem;"></i>Download brief (PDF)</a>
        </p>
      </div>

      <!-- OBJECTIF -->
      <div class="modal-section">
        <h3><i class="fas fa-bullseye"></i> Goal</h3>
        <p>I designed aluminum cast parts for a hydraulic cylinder, ran FEA to confirm they would hold up, then trimmed mass without sacrificing function.</p>
      </div>

      <!-- ANALYSE DU SYSTÈME -->
      <div class="modal-section">
        <h3><i class="fas fa-search"></i> System analysis</h3>
        <p>Work began by analyzing how a hydraulic pressure intensifier using a differential piston increases fluid pressure. This step identified the role of each part and the essential functional surfaces.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_plan_ensemble.png" alt="Intensifier assembly drawing" style="width:100%;">
            <div class="modal-img-caption">Assembly drawing of the pressure intensifier</div>
          </div>
        </div>
      </div>

      <!-- CONCEPTION TÊTE DE VÉRIN -->
      <div class="modal-section">
        <h3><i class="fas fa-pencil-ruler"></i> Cylinder end cap design</h3>
        <p>The cylinder end cap was then designed incorporating casting design rules: parting plane selection, draft angles, thickness control, and preservation of functional surfaces. The part was modeled in 3D in SolidWorks.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_tete_3d.png" alt="3D model cylinder end cap">
            <div class="modal-img-caption">3D model of the cylinder end cap</div>
          </div>
        </div>
        <div class="modal-img-grid single" style="margin-top:1rem;">
          <div class="modal-img-container">
            <img src="multi_plan_joint.png" alt="Parting plane" style="width:100%;">
            <div class="modal-img-caption">Parting plane of the cylinder end cap</div>
          </div>
        </div>
      </div>

      <!-- SIMULATION TÊTE DE VÉRIN -->
      <div class="modal-section">
        <h3><i class="fas fa-chart-area"></i> Mechanical validation — Cylinder end cap</h3>
        <p>Mechanical validation was performed by simulation accounting for fluid pressure, stud tightening loads, and actual assembly conditions. Results confirmed the part's mechanical strength and rigidity.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_tete_simulation.png" alt="Von Mises simulation cylinder end cap" style="width:100%;">
            <div class="modal-img-caption">Von Mises stress simulation — cylinder end cap</div>
          </div>
        </div>
      </div>

      <!-- OPTIMISATION TÊTE DE VÉRIN -->
      <div class="modal-section">
        <h3><i class="fas fa-weight-hanging"></i> Optimization — Cylinder end cap</h3>
        <p>The cylinder end cap was then optimized by removing material in lightly loaded zones while preserving functional areas.</p>
        <div class="modal-img-grid" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_tete_avant.png" alt="Cylinder end cap before optimization">
            <div class="modal-img-caption">Before optimization — 1,226.94 g</div>
          </div>
          <div class="modal-img-container">
            <img src="multi_tete_apres.png" alt="Cylinder end cap after optimization">
            <div class="modal-img-caption">After optimization — 851.29 g</div>
          </div>
        </div>
        <div class="modal-result-box">
          <div class="result-row">
            <span>Mass before optimization</span>
            <span>1 226,94 g</span>
          </div>
          <div class="result-row">
            <span>Mass after optimization</span>
            <span>851,29 g</span>
          </div>
          <div class="result-row highlight">
            <span>Mass savings</span>
            <span>~376 g (−31%)</span>
          </div>
        </div>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_tete_plan.png" alt="Cylinder end cap engineering drawing" style="width:100%;">
            <div class="modal-img-caption">Engineering drawing — optimized cylinder end cap</div>
          </div>
        </div>
      </div>

      <!-- CONCEPTION EMBASE -->
      <div class="modal-section">
        <h3><i class="fas fa-pencil-ruler"></i> Base design</h3>
        <p>The cylinder base was then designed respecting casting manufacturing constraints and functional surfaces related to assembly and fluid flow. The design was intended to ease fabrication and assembly.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_embase_3d.png" alt="3D view assembled base">
            <div class="modal-img-caption">3D view of the assembled base</div>
          </div>
        </div>
      </div>

      <!-- SIMULATION EMBASE -->
      <div class="modal-section">
        <h3><i class="fas fa-chart-area"></i> Mechanical validation — Base</h3>
        <p>A mechanical simulation verified the base's strength and rigidity under hydraulic pressure and tightening loads.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_embase_simulation.png" alt="Simulation contraintes embase" style="width:100%;">
            <div class="modal-img-caption">Von Mises stress simulation — base</div>
          </div>
        </div>
      </div>

      <!-- OPTIMISATION EMBASE -->
      <div class="modal-section">
        <h3><i class="fas fa-weight-hanging"></i> Optimization — Base</h3>
        <p>Geometric optimization was then performed by removing material in lightly loaded zones while keeping areas under high stress.</p>
        <div class="modal-img-grid" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_embase_avant.png" alt="Base before optimization">
            <div class="modal-img-caption">Before optimization — 2,381.91 g</div>
          </div>
          <div class="modal-img-container">
            <img src="multi_embase_apres.png" alt="Base after optimization">
            <div class="modal-img-caption">After optimization — 1,799.08 g</div>
          </div>
        </div>
        <div class="modal-result-box">
          <div class="result-row">
            <span>Mass before optimization</span>
            <span>2 381,91 g</span>
          </div>
          <div class="result-row">
            <span>Mass after optimization</span>
            <span>1 799,08 g</span>
          </div>
          <div class="result-row highlight">
            <span>Mass savings</span>
            <span>~583 g (−24%)</span>
          </div>
        </div>
      </div>

      <!-- MISE EN PLAN EMBASE -->
      <div class="modal-section">
        <h3><i class="fas fa-drafting-compass"></i> Final engineering drawing — Base</h3>
        <p>The project concluded with an industrial drawing of the optimized base for manufacturing.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="multi_embase_plan.png" alt="Mise en plan embase" style="width:100%;">
            <div class="modal-img-caption">Final drawing — optimized base</div>
          </div>
        </div>
      </div>

      <!-- RÉSULTAT FINAL -->
      <div class="modal-section">
        <h3><i class="fas fa-check-circle"></i> Final result</h3>
        <p>The project produced optimized casting parts suited to industrial manufacturing while ensuring mechanical strength and rigidity through numerical simulation.</p>
      </div>
`,
  modalRenvoi: `
<div class="modal-header">
        <h2>Aerospace bevel gearbox — Design and CAD modeling</h2>
        <div class="modal-tags">
          <span class="projet-tag">SolidWorks</span>
          <span class="projet-tag">Sizing</span>
          <span class="projet-tag">Roulements SKF</span>
          <span class="projet-tag">Bevel gears</span>
          <span class="projet-tag">Housing design</span>
        </div>
      </div>

      <!-- ÉNONCÉ DU PROJET -->
      <div class="modal-section">
        <h3><i class="fas fa-file-pdf"></i> Project brief</h3>
        <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-bottom:0.5rem;">
          <iframe src="renvoi_sujet.pdf" style="width:100%;height:600px;border:none;background:#1a1a24;"></iframe>
        </div>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:#707070;">
          <a href="renvoi_sujet.pdf" target="_blank" style="color:#60a5fa;"><i class="fas fa-download" style="margin-right:0.4rem;"></i>Download brief (PDF)</a>
        </p>
      </div>

      <!-- MISE EN CONTEXTE -->
      <div class="modal-section">
        <h3><i class="fas fa-bullseye"></i> System context</h3>
        <p>The project covers the design of an aerospace bevel gearbox meeting life, reliability, rotational speed, and mass requirements. The overall kinematic diagram identified the mechanism architecture and load reaction zones required for sizing.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="renvoi_schema_cinematique.png" alt="Overall kinematic diagram of the bevel gearbox">
            <div class="modal-img-caption">Overall kinematic diagram of the bevel gearbox</div>
          </div>
        </div>
      </div>

      <!-- DIMENSIONNEMENT DES ROULEMENTS -->
      <div class="modal-section">
        <h3><i class="fas fa-cogs"></i> Bearing study and sizing</h3>
        <p>The initial objective was to select bearings at points A and B per the specification requirements. Two technical solutions were compared:</p>
        <ul>
          <li>A mounting with a rigid ball bearing and a cylindrical roller bearing</li>
          <li>An X-arrangement with two angular contact ball bearings</li>
        </ul>
        <p style="margin-top:0.75rem;">Calculations were performed under worst-case conditions then under actual operating conditions (flight cycle). With no solution from the initial documentation simultaneously meeting load, speed, and life criteria, an SKF catalog search was carried out to balance performance and mass.</p>
        <div class="modal-img-grid" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="renvoi_implantation_roulements.png" alt="Bearing A and B layout diagram">
            <div class="modal-img-caption">Bearing A and B layout diagram</div>
          </div>
          <div class="modal-img-container">
            <img src="renvoi_montage_x.png" alt="X-arrangement bearing mounting">
            <div class="modal-img-caption">X-arrangement bearing mounting</div>
          </div>
        </div>
        <p style="margin-top:0.75rem;">The selected bearings meet the constraints while significantly reducing overall mass.</p>
      </div>

      <!-- MODÉLISATION ENGRENAGES ET ARBRES -->
      <div class="modal-section">
        <h3><i class="fas fa-drafting-compass"></i> Gear and shaft modeling</h3>
        <p>Bevel pinions were modeled in SolidWorks from functional data (tooth count, module, material). Shafts were designed with shoulders for axial retention of components and slip-free torque transmission.</p>
        <div class="modal-img-grid" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="renvoi_pignon_entree.png" alt="Input pinion — 31 teeth">
            <div class="modal-img-caption">Input pinion — 31 teeth</div>
          </div>
          <div class="modal-img-container">
            <img src="renvoi_pignon_sortie.png" alt="Output pinion — 40 teeth">
            <div class="modal-img-caption">Output pinion — 40 teeth</div>
          </div>
        </div>
      </div>

      <!-- ASSEMBLAGE CAO TRANSMISSION -->
      <div class="modal-section">
        <h3><i class="fas fa-cubes"></i> CAD assembly of the transmission</h3>
        <p>The shaft–bearing–gear assembly was built respecting tolerances and assembly conditions to ensure proper component positioning and system life.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="renvoi_assemblage_transmission.png" alt="Complete transmission assembly">
            <div class="modal-img-caption">Complete transmission assembly</div>
          </div>
        </div>
      </div>

      <!-- CARTER SYSTÈME 1 -->
      <div class="modal-section">
        <h3><i class="fas fa-box"></i> Housing design — System 1: mid-plane split line</h3>
        <p>A first compact, easy-to-assemble housing was designed. However, placing the split line in the lubricated zone led to:</p>
        <ul>
          <li>Oil leak risk</li>
          <li>Possible bearing misalignment</li>
          <li>Reduced reliability</li>
        </ul>
        <div class="modal-img-grid" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="renvoi_carter1_coupe.png" alt="Housing system 1 — section view">
            <div class="modal-img-caption">Housing system 1 — section view</div>
          </div>
          <div class="modal-img-container">
            <img src="renvoi_carter1_ext.png" alt="Housing system 1 — exterior view">
            <div class="modal-img-caption">Housing system 1 — exterior view</div>
          </div>
        </div>
        <div class="modal-img-grid single" style="margin-top:1rem;">
          <div class="modal-img-container">
            <img src="renvoi_carter1_interne.png" alt="Internal operation system 1">
            <div class="modal-img-caption">Internal operation — system 1</div>
          </div>
        </div>
      </div>

      <!-- CARTER SYSTÈME 2 — RETENU -->
      <div class="modal-section">
        <h3><i class="fas fa-check-double"></i> Selected system — Housing with offset split line</h3>
        <p>Housing geometry was modified to move the split line outside the lubricated volume.</p>
        <p style="margin-top:0.75rem;">This solution was chosen because it:</p>
        <ul>
          <li>Greatly improves sealing</li>
          <li>Ensures better bearing alignment</li>
          <li>Increases system reliability</li>
        </ul>
        <p style="margin-top:0.75rem;">This is a priority criterion in aerospace.</p>
        <p style="margin-top:0.75rem;">However, this architecture makes assembly less accessible and requires more machining operations. Further design improvement is therefore needed to optimize assembly and maintenance accessibility for industrialization.</p>
        <div class="modal-img-grid single" style="margin-top:1.25rem;">
          <div class="modal-img-container">
            <img src="renvoi_carter2_geometrie.png" alt="Housing geometric modification — offset split line">
            <div class="modal-img-caption">Housing geometric modification — offset split line</div>
          </div>
        </div>
        <div class="modal-img-grid" style="margin-top:1rem;">
          <div class="modal-img-container">
            <img src="renvoi_carter2_interne.png" alt="Internal operation system 2">
            <div class="modal-img-caption">Internal operation — system 2</div>
          </div>
          <div class="modal-img-container">
            <img src="renvoi_carter2_complet.png" alt="Complete assembly of system 2">
            <div class="modal-img-caption">Complete assembly — selected system</div>
          </div>
        </div>
      </div>

      <!-- RÉSULTAT FINAL -->
      <div class="modal-section">
        <h3><i class="fas fa-check-circle"></i> Result</h3>
        <p>I sketched out a complete bevel gearbox concept: compared layout options, sized real bearings and gears, modeled everything in CAD, and weighed performance, weight, reliability, and ease of manufacturing.</p>
      </div>
`,
  modalCSWA: `
<div class="modal-header">
        <h2>CSWA — Certified SolidWorks Associate (Design)</h2>
        <div class="modal-tags">
          <span class="projet-tag">Dassault Systèmes</span>
          <span class="projet-tag">SolidWorks</span>
          <span class="projet-tag">Design</span>
          <span class="projet-tag">February 2026</span>
        </div>
      </div>

      <div class="modal-section">
        <h3><i class="fas fa-certificate"></i> Official certificate</h3>
        <p>Professional certification issued by Dassault Systèmes, attesting skills in computer-aided mechanical design with SolidWorks.</p>
        <p style="margin-top:0.5rem;"><strong>ID:</strong> C-37C9EJWGR5</p>
        <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-top:1.25rem;">
          <iframe src="cswa_certificate.pdf" style="width:100%;height:700px;border:none;background:#1a1a24;"></iframe>
        </div>
        <p style="margin-top:0.75rem;font-size:0.85rem;color:#707070;">
          <a href="cswa_certificate.pdf" target="_blank" style="color:#60a5fa;"><i class="fas fa-download" style="margin-right:0.4rem;"></i>Download certificate (PDF)</a>
        </p>
      </div>
`,
};
