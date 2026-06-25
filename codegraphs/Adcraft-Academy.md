# Adcraft-Academy - Code Dependency Graph

```mermaid
graph TD
    next_config["next_config"]
    playwright_config["playwright_config"]
    tailwind_config["tailwind_config"]
    vitest_config["vitest_config"]
    e2e_smoke_spec["e2e_smoke_spec"]
    examples_websocket_frontend["examples_websocket_frontend"]
    examples_websocket_server["examples_websocket_server"]
    scripts_puter_api["scripts_puter_api"]
    src_instrumentation["src_instrumentation"]
    src_middleware["src_middleware"]
    src_app_layout["src_app_layout"]
    src_app_page["src_app_page"]
    src_app_actions_admin["src_app_actions_admin"]
    src_app_actions_analytics["src_app_actions_analytics"]
    src_app_actions_badge["src_app_actions_badge"]
    src_app_actions_certificate_lifecycle["src_app_actions_certificate_lifecycle"]
    src_app_actions_certificate["src_app_actions_certificate"]
    src_app_actions_cheatsheet["src_app_actions_cheatsheet"]
    src_app_actions_events["src_app_actions_events"]
    src_app_actions_leaderboard["src_app_actions_leaderboard"]
    src_app_actions_lesson["src_app_actions_lesson"]
    src_app_actions_mentor["src_app_actions_mentor"]
    src_app_actions_mistake_analysis["src_app_actions_mistake_analysis"]
    src_app_actions_progress["src_app_actions_progress"]
    src_app_actions_quiz["src_app_actions_quiz"]
    src_app_actions_simulation["src_app_actions_simulation"]
    src_app_actions_team["src_app_actions_team"]
    src_app_actions_types["src_app_actions_types"]
    src_app_api_route["src_app_api_route"]
    src_app_api_auth_[___nextauth]_route["src_app_api_auth_[___nextauth]_route"]
    src_app_api_auth_signup_route["src_app_api_auth_signup_route"]
    src_app_api_health_route["src_app_api_health_route"]
    src_app_api_mentor_stream_route["src_app_api_mentor_stream_route"]
    src_app_auth_signin_page["src_app_auth_signin_page"]
    src_app_auth_signup_page["src_app_auth_signup_page"]
    src_app_verify_[hash]_page["src_app_verify_[hash]_page"]
    src_components_adcraft_admin_analytics["src_components_adcraft_admin_analytics"]
    src_components_adcraft_analytics_dashboard["src_components_adcraft_analytics_dashboard"]
    src_components_adcraft_badge_showcase["src_components_adcraft_badge_showcase"]
    src_components_adcraft_bid_arena["src_components_adcraft_bid_arena"]
    src_components_adcraft_bid_briefing["src_components_adcraft_bid_briefing"]
    src_components_adcraft_bid_elevator["src_components_adcraft_bid_elevator"]
    src_components_adcraft_bid_review["src_components_adcraft_bid_review"]
    src_components_adcraft_bid_scoring["src_components_adcraft_bid_scoring"]
    src_components_adcraft_campaign_briefing["src_components_adcraft_campaign_briefing"]
    src_components_adcraft_campaign_builder["src_components_adcraft_campaign_builder"]
    src_components_adcraft_campaign_review["src_components_adcraft_campaign_review"]
    src_components_adcraft_campaign_scoring["src_components_adcraft_campaign_scoring"]
    src_components_adcraft_campaign_workshop["src_components_adcraft_campaign_workshop"]
    src_components_adcraft_certificate_manager["src_components_adcraft_certificate_manager"]
    src_components_adcraft_certificate["src_components_adcraft_certificate"]
    src_components_adcraft_dashboard["src_components_adcraft_dashboard"]
    src_components_adcraft_error_boundary["src_components_adcraft_error_boundary"]
    src_components_adcraft_formula_calculator["src_components_adcraft_formula_calculator"]
    src_components_adcraft_leaderboard["src_components_adcraft_leaderboard"]
    src_components_adcraft_lesson_player["src_components_adcraft_lesson_player"]
    src_components_adcraft_mentor_chat["src_components_adcraft_mentor_chat"]
    src_components_adcraft_mistake_replay["src_components_adcraft_mistake_replay"]
    src_components_adcraft_module_cards["src_components_adcraft_module_cards"]
    src_components_adcraft_quiz_player["src_components_adcraft_quiz_player"]
    src_components_adcraft_sidebar["src_components_adcraft_sidebar"]
    src_components_adcraft_simulation_cards["src_components_adcraft_simulation_cards"]
    src_components_adcraft_stats_row["src_components_adcraft_stats_row"]
    src_components_adcraft_str_briefing["src_components_adcraft_str_briefing"]
    src_components_adcraft_str_data_grid["src_components_adcraft_str_data_grid"]
    src_components_adcraft_str_review["src_components_adcraft_str_review"]
    src_components_adcraft_str_scoring["src_components_adcraft_str_scoring"]
    src_components_adcraft_str_triage_arena["src_components_adcraft_str_triage_arena"]
    src_components_adcraft_team_dashboard["src_components_adcraft_team_dashboard"]
    src_components_adcraft_xp_progress["src_components_adcraft_xp_progress"]
    src_components_providers_session_provider["src_components_providers_session_provider"]
    src_components_ui_avatar["src_components_ui_avatar"]
    src_components_ui_badge["src_components_ui_badge"]
    src_components_ui_button["src_components_ui_button"]
    src_components_ui_card["src_components_ui_card"]
    src_components_ui_input["src_components_ui_input"]
    src_components_ui_label["src_components_ui_label"]
    src_components_ui_progress["src_components_ui_progress"]
    src_components_ui_scroll_area["src_components_ui_scroll_area"]
    src_components_ui_select["src_components_ui_select"]
    src_components_ui_separator["src_components_ui_separator"]
    src_components_ui_slider["src_components_ui_slider"]
    src_components_ui_tabs["src_components_ui_tabs"]
    src_components_ui_toast["src_components_ui_toast"]
    src_components_ui_toaster["src_components_ui_toaster"]
    src_components_ui_tooltip["src_components_ui_tooltip"]
    src_engine_evaluation_test["src_engine_evaluation_test"]
    src_engine_evaluation["src_engine_evaluation"]
    src_engine_formulas_test["src_engine_formulas_test"]
    src_engine_formulas["src_engine_formulas"]
    src_engine_index["src_engine_index"]
    src_engine_mistake_analysis_test["src_engine_mistake_analysis_test"]
    src_engine_mistake_analysis["src_engine_mistake_analysis"]
    src_engine_simulation["src_engine_simulation"]
    src_engine_types["src_engine_types"]
    src_hooks_use_puter_chat["src_hooks_use_puter_chat"]
    src_hooks_use_toast["src_hooks_use_toast"]
    src_lib_auth_guard["src_lib_auth_guard"]
    src_lib_auth["src_lib_auth"]
    src_lib_db["src_lib_db"]
    src_lib_env["src_lib_env"]
    src_lib_logger["src_lib_logger"]
    src_lib_puter_d["src_lib_puter_d"]
    src_lib_rate_limit["src_lib_rate_limit"]
    src_lib_utils["src_lib_utils"]
    src_stores_bid_elevator_store["src_stores_bid_elevator_store"]
    src_stores_campaign_builder_store["src_stores_campaign_builder_store"]
    src_stores_str_triage_store["src_stores_str_triage_store"]
    src_app_layout --> src_app_globals
    src_app_actions_admin --> src_app_actions_types
    src_app_actions_analytics --> src_app_actions_types
    src_app_actions_certificate_lifecycle --> src_app_actions_events
    src_app_actions_certificate_lifecycle --> src_app_actions_types
    src_app_actions_certificate --> src_app_actions_types
    src_app_actions_cheatsheet --> src_app_actions_types
    src_app_actions_events --> src_app_actions_types
    src_app_actions_leaderboard --> src_app_actions_types
    src_app_actions_lesson --> src_app_actions_types
    src_app_actions_mentor --> src_app_actions_events
    src_app_actions_mistake_analysis --> src_app_actions_events
    src_app_actions_mistake_analysis --> src_app_actions_types
    src_app_actions_progress --> src_app_actions_events
    src_app_actions_quiz --> src_app_actions_badge
    src_app_actions_quiz --> src_app_actions_events
    src_app_actions_simulation --> src_app_actions_events
    src_app_actions_team --> src_app_actions_events
    src_app_actions_team --> src_app_actions_types
    src_components_adcraft_bid_elevator --> src_components_adcraft_bid_briefing
    src_components_adcraft_bid_elevator --> src_components_adcraft_bid_arena
    src_components_adcraft_bid_elevator --> src_components_adcraft_bid_scoring
    src_components_adcraft_bid_elevator --> src_components_adcraft_bid_review
    src_components_adcraft_campaign_builder --> src_components_adcraft_campaign_briefing
    src_components_adcraft_campaign_builder --> src_components_adcraft_campaign_workshop
    src_components_adcraft_campaign_builder --> src_components_adcraft_campaign_scoring
    src_components_adcraft_campaign_builder --> src_components_adcraft_campaign_review
    src_components_adcraft_dashboard --> src_components_adcraft_xp_progress
    src_components_adcraft_dashboard --> src_components_adcraft_stats_row
    src_components_adcraft_dashboard --> src_components_adcraft_module_cards
    src_components_adcraft_dashboard --> src_components_adcraft_simulation_cards
    src_components_adcraft_dashboard --> src_components_adcraft_sidebar
    src_components_adcraft_str_triage_arena --> src_components_adcraft_str_briefing
    src_components_adcraft_str_triage_arena --> src_components_adcraft_str_data_grid
    src_components_adcraft_str_triage_arena --> src_components_adcraft_str_scoring
    src_components_adcraft_str_triage_arena --> src_components_adcraft_str_review
    src_engine_evaluation --> src_engine_formulas
    src_stores_bid_elevator_store --> fixtures_bid_elevator_pack_1
    src_stores_campaign_builder_store --> fixtures_campaign_builder_pack_1
    src_stores_str_triage_store --> fixtures_str_triage_pack_1
```