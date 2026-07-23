// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn start_oauth_server(app: tauri::AppHandle) -> Result<u16, String> {
    use std::net::TcpListener;
    use std::io::{Read, Write};
    use tauri::Emitter;

    let listener = TcpListener::bind("127.0.0.1:1421").map_err(|e| e.to_string())?;
    let port = listener.local_addr().unwrap().port();

    std::thread::spawn(move || {
        for stream in listener.incoming() {
            if let Ok(mut stream) = stream {
                let mut buffer = [0; 8192];
                let bytes_read = stream.read(&mut buffer).unwrap_or(0);
                if bytes_read == 0 { continue; }
                let request = String::from_utf8_lossy(&buffer[..bytes_read]);

                if request.starts_with("GET /callback") {
                    let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n\
                        <!DOCTYPE html><html><head><title>Hoàn tất đăng nhập - Memories</title>\
                        <style>\
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Playfair+Display:ital,wght@0,600&display=swap');\
                        body { background: #f4efe6; color: #3b2f2f; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }\
                        .card { background: #ffffff; padding: 40px; border-radius: 4px; box-shadow: 0 8px 24px rgba(59, 47, 47, 0.12); text-align: center; border: 1px solid rgba(59, 47, 47, 0.1); max-width: 400px; width: 90%; }\
                        h2 { font-family: 'Playfair Display', serif; color: #c97a7e; margin-top: 0; font-size: 1.8rem; font-style: italic; }\
                        p { color: #6e5f5f; line-height: 1.5; font-size: 0.95rem; margin-bottom: 0; }\
                        </style>\
                        </head><body>\
                        <div class=\"card\" id=\"msg\">\
                        <h2>Đang xử lý...</h2>\
                        <p>Vui lòng chờ trong giây lát.</p>\
                        </div>\
                        <script>\
                        const hash = window.location.hash.substring(1);\
                        const search = window.location.search.substring(1);\
                        const data = hash ? hash : search;\
                        fetch('/token?' + data).then(() => { \
                            const msg = document.getElementById('msg');\
                            if (data.includes('error=')) {\
                                msg.innerHTML = '<h2>Đăng nhập bị hủy</h2><p>Bạn có thể đóng trang này và quay lại ứng dụng.</p>';\
                            } else {\
                                msg.innerHTML = '<h2>Đăng nhập thành công!</h2><p>Bạn có thể đóng trang này và quay lại ứng dụng.</p>';\
                            }\
                            setTimeout(() => window.close(), 3000);\
                        });\
                        </script></body></html>";
                    let _ = stream.write_all(response.as_bytes());
                } else if request.starts_with("GET /token?") {
                    if let Some(first_line) = request.lines().next() {
                        if let Some(url) = first_line.split_whitespace().nth(1) {
                            let _ = app.emit("oauth-token", url);
                        }
                    }
                    let response = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
                    let _ = stream.write_all(response.as_bytes());
                    break;
                }
            }
        }
    });

    Ok(port)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS photos (
                    id TEXT PRIMARY KEY,
                    path TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    date_taken TEXT,
                    size INTEGER,
                    favorite BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS albums (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    cover_photo_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(cover_photo_id) REFERENCES photos(id)
                );

                CREATE TABLE IF NOT EXISTS photo_albums (
                    photo_id TEXT NOT NULL,
                    album_id TEXT NOT NULL,
                    PRIMARY KEY(photo_id, album_id),
                    FOREIGN KEY(photo_id) REFERENCES photos(id) ON DELETE CASCADE,
                    FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS tags (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE
                );

                CREATE TABLE IF NOT EXISTS photo_tags (
                    photo_id TEXT NOT NULL,
                    tag_id TEXT NOT NULL,
                    PRIMARY KEY(photo_id, tag_id),
                    FOREIGN KEY(photo_id) REFERENCES photos(id) ON DELETE CASCADE,
                    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
                );
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:memories.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            use tauri::Manager;
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};

            let quit_i = MenuItem::with_id(app, "quit", "Thoát", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Mở Ứng dụng", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![greet, start_oauth_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
