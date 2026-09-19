var PPC = PPC || {};

// Each reflection uses ONLY its recorded observation/answer. No answer keys,
// candidate rankings, hidden findings or inferred absence of unchecked signs.
PPC.EvidenceReflections = {
  rose_rust: {
    "observe:leaf_top": { suggests: "Spot colour and distribution offer a pattern to compare.", limits: "Upper-surface colour alone cannot explain the damage." },
    "observe:leaf_under": { suggests: "A closer view could clarify the material's texture.", limits: "Dustiness alone cannot distinguish loose debris from leaf growth." },
    "flip:leaf_under": { suggests: "Raised structures offer more specific evidence than colour changes alone.", limits: "Their colour, texture and location need comparison with alternative explanations." },
    "observe:fallen": { suggests: "The litter extends your record of affected tissue beyond attached leaves.", limits: "Leaf fall neither explains the cause nor proves litter started the problem." },
    "observe:canopy": { suggests: "Crowding could slow drying around the stems.", limits: "Poor airflow favours several problems, so it cannot distinguish the cause." },
    "answer:q_watering": { suggests: "The reported routine could prolong evening leaf wetness.", limits: "Reported exposure does not prove wet leaves caused these spots." },
    "answer:q_neighbors": { suggests: "The report suggests a local problem.", limits: "Healthy-looking neighbours may have early infections without visible symptoms." },
    "answer:q_timing": { suggests: "The reported timing suggests a possible link with damp conditions.", limits: "Timing alone cannot establish that damp conditions caused the spots." },
    "answer:q_spacing": { suggests: "The reported layout could restrict airflow.", limits: "Spacing describes growing conditions, not the cause of damage." }
  },
  powdery_mildew: {
    "observe:powder_upper": { suggests: "Surface material suggests a coating rather than discoloration alone.", limits: "Colour cannot identify the material without considering texture and distribution." },
    "observe:base_check": { suggests: "The contrast helps locate where the coating appears.", limits: "No underside fuzz in this view does not exclude infection elsewhere." },
    "observe:spacing": { suggests: "These conditions could favour surface growth.", limits: "Still, humid air supports several problems, not one specific cause." },
    "observe:soil": { suggests: "The moisture record argues against prolonged waterlogging.", limits: "These moisture details neither explain leaf damage nor exclude moisture-related problems." },
    "answer:q_wet": { suggests: "The report weighs against explanations needing prolonged leaf wetness.", limits: "The owner's account cannot establish leaf conditions throughout the day." },
    "answer:q_fert": { suggests: "Reported heavy feeding may have encouraged susceptible growth.", limits: "Feeding history alone establishes neither nutrient injury nor infection." },
    "answer:q_air": { suggests: "The reported still air suggests limited ventilation.", limits: "Poor ventilation is a shared risk, not a distinguishing sign." },
    "answer:q_other": { suggests: "Reported clustering makes differences in spacing and exposure worth comparing.", limits: "Clustering cannot distinguish shared growing conditions from infection." }
  },
  basil_downy_mildew: {
    "observe:angular_yellow": { suggests: "The pattern suggests damage within leaf tissue rather than a coating.", limits: "Vein-bounded shape helps comparison but cannot establish what damaged the tissue." },
    "observe:downy_under": { suggests: "A closer underside view could clarify the surface.", limits: "Shadow and dullness alone do not establish growth." },
    "flip:downy_under": { suggests: "The growth's location and texture help distinguish surface patterns.", limits: "Fuzzy coatings are not all equivalent; context still matters." },
    "observe:curled_margin": { suggests: "The damage pattern suggests progression inward through older tissue.", limits: "Edge damage has several causes, so it cannot distinguish one alone." },
    "observe:dense_canopy": { suggests: "Overlap could prolong humidity beneath the leaves.", limits: "Favourable conditions cannot identify any growth or the cause of damage." },
    "answer:q_night_humidity": { suggests: "Reported condensation suggests prolonged morning leaf wetness.", limits: "Wetness indicates risk rather than directly showing the cause of damage." },
    "answer:q_watering_basil": { suggests: "Reported spraying could prolong overnight wetness.", limits: "Watering history alone cannot distinguish possible causes of leaf damage." },
    "answer:q_spread_basil": { suggests: "The reported progression makes shared exposures worth comparing.", limits: "Neighbouring plants can share growing conditions; progression does not prove transmission." },
    "answer:q_wipe": { suggests: "The report suggests a coating concentrated underneath.", limits: "The owner's comparison still needs checking through direct surface inspection." },
    "answer:q_flavor": { suggests: "The report provides no taste evidence.", limits: "Safety remains unknown; tasting affected leaves is not an appropriate check." }
  },
  tomato_septoria: {
    "observe:septoria_spots": { suggests: "The combined lesion details provide a distinctive pattern to compare.", limits: "Visible dots alone cannot identify an organism or the dots' nature." },
    "observe:lower_progression": { suggests: "The distribution suggests investigating whether damage progressed upward.", limits: "Older leaves suffer first for several reasons; position alone cannot establish cause." },
    "observe:soil_splash": { suggests: "The marks suggest a route from soil to lower plant surfaces.", limits: "Splash evidence cannot prove that it carried a pathogen." },
    "observe:clean_fruit": { suggests: "The contrast suggests damage is concentrated on foliage.", limits: "Unspotted fruit neither proves overall health nor rules out leaf disease." },
    "answer:q_first_tomato": { suggests: "The report suggests a progression pattern linked with storms.", limits: "Timing cannot prove storms spread the cause." },
    "answer:q_splash_tomato": { suggests: "The reported routine suggests a soil-to-leaf splash route.", limits: "A possible exposure route cannot confirm an infectious cause." },
    "answer:q_debris_tomato": { suggests: "Reported plant remains could be a source worth investigating.", limits: "Their presence cannot prove they carried the cause of current symptoms." },
    "answer:q_fruit_tomato": { suggests: "The report suggests damage concentrated on foliage.", limits: "Reported absence of fruit symptoms cannot independently confirm the cause." },
    "answer:q_fertilizer_tomato": { suggests: "The reported rate weighs against assuming unusually heavy feeding.", limits: "Reported dosage cannot establish nutrient status or exclude other growing-condition problems." }
  }
};
