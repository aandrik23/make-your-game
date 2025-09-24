package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"time"

	figlet "github.com/common-nighthawk/go-figure"
)

func main() {
	addr := flag.String("addr", "0.0.0.0:8000", "address to listen on")
	dir := flag.String("dir", ".", "directory to serve")
	dev := flag.Bool("dev", false, "disable caching (for local dev)")
	cors := flag.String("cors", "", "value for Access-Control-Allow-Origin (empty to disable)")
	flag.Parse()

	// Ensure directory exists
	if _, err := os.Stat(*dir); err != nil {
		log.Fatalf("serve dir: %v", err)
	}

	// Initialize scoreboard API
	scoreHandler := initScoreboardAPI()

	mux := http.NewServeMux()

	mux.Handle("/api/scores", scoreHandler)

	// File server for static files
	fs := http.FileServer(http.Dir(*dir))
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// light security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")

		// Optional CORS
		if *cors != "" {
			w.Header().Set("Access-Control-Allow-Origin", *cors)
			w.Header().Set("Vary", "Origin")
		}

		// Simple caching: off in dev, short cache otherwise
		if *dev {
			w.Header().Set("Cache-Control", "no-store")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=300")
		}

		start := time.Now()
		fs.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	}))

	handler := mux

	// Bind first so we *know* it started
	ln, err := net.Listen("tcp4", *addr)
	if err != nil {
		log.Fatalf("listen: %v", err)
	}

	srv := &http.Server{
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}
	logo()
	fmt.Printf("Serving %s at http://%s\n", absPath(*dir), ln.Addr())

	// Graceful shutdown on Ctrl+C
	idle := make(chan struct{})
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt)
		<-c
		fmt.Println("\nshutting down...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
		close(idle)
	}()

	// Serve (blocking)
	if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server: %v", err)
	}
	<-idle
}

func absPath(p string) string {
	ap, err := filepath.Abs(p)
	if err != nil {
		return p
	}
	return ap
}

func logo() {
	// generate ASCII art with a slim font
	banner := figlet.NewFigure("BOMBERMAN", "small", false)
	banner.Print()
}
