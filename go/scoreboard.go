package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
)

// Score represents a player's game score
type Score struct {
	Name  string `json:"name"`
	Rank  int    `json:"rank"`
	Score int    `json:"score"`
	Time  string `json:"time"`
}

// ScoreSubmission represents data sent when submitting a score
type ScoreSubmission struct {
	Name  string `json:"name"`
	Score int    `json:"score"`
	Time  string `json:"time"`
}

// ScoreResponse represents the API response with pagination info
type ScoreResponse struct {
	Scores      []Score `json:"scores"`
	TotalPages  int     `json:"totalPages"`
	CurrentPage int     `json:"currentPage"`
	PlayerRank  int     `json:"playerRank,omitempty"`
	Percentile  float64 `json:"percentile,omitempty"`
	Message     string  `json:"message,omitempty"`
}

// ScoreService handles score operations following Single Responsibility Principle
type ScoreService struct {
	storage ScoreStorage
}

// ScoreStorage interface for dependency inversion principle
type ScoreStorage interface {
	SaveScores(scores []Score) error
	LoadScores() ([]Score, error)
}

// FileStorage implements ScoreStorage interface
type FileStorage struct {
	filename string
}

// NewFileStorage creates a new file storage instance
func NewFileStorage(filename string) *FileStorage {
	return &FileStorage{filename: filename}
}

// SaveScores saves scores to a JSON file
func (fs *FileStorage) SaveScores(scores []Score) error {
	data, err := json.MarshalIndent(scores, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal scores: %w", err)
	}

	if err := os.WriteFile(fs.filename, data, 0644); err != nil {
		return fmt.Errorf("failed to write scores file: %w", err)
	}

	return nil
}

// LoadScores loads scores from a JSON file
func (fs *FileStorage) LoadScores() ([]Score, error) {
	data, err := os.ReadFile(fs.filename)
	if err != nil {
		if os.IsNotExist(err) {
			return []Score{}, nil // Return empty slice if file doesn't exist
		}
		return nil, fmt.Errorf("failed to read scores file: %w", err)
	}

	var scores []Score
	if err := json.Unmarshal(data, &scores); err != nil {
		return nil, fmt.Errorf("failed to unmarshal scores: %w", err)
	}

	return scores, nil
}

// NewScoreService creates a new score service
func NewScoreService(storage ScoreStorage) *ScoreService {
	return &ScoreService{storage: storage}
}

// AddScore adds a new score and returns the updated rankings
func (ss *ScoreService) AddScore(submission ScoreSubmission) (*ScoreResponse, error) {
	scores, err := ss.storage.LoadScores()
	if err != nil {
		return nil, fmt.Errorf("failed to load existing scores: %w", err)
	}

	// Add new score
	newScore := Score{
		Name:  submission.Name,
		Score: submission.Score,
		Time:  submission.Time,
	}
	scores = append(scores, newScore)

	// Sort by score descending
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Score > scores[j].Score
	})

	// Update ranks
	for i := range scores {
		scores[i].Rank = i + 1
	}

	// Save updated scores
	if err := ss.storage.SaveScores(scores); err != nil {
		return nil, fmt.Errorf("failed to save scores: %w", err)
	}

	// Find player's rank and calculate percentile
	playerRank := 0
	for _, score := range scores {
		if score.Name == submission.Name && score.Score == submission.Score && score.Time == submission.Time {
			playerRank = score.Rank
			break
		}
	}

	percentile := ss.calculatePercentile(playerRank, len(scores))

	// Get top 5 scores for response
	topScores := ss.getTopScores(scores, 5)

	message := fmt.Sprintf("Congrats %s, you are in the top %.0f%%, on the %s position.",
		submission.Name, percentile, ss.formatRank(playerRank))

	return &ScoreResponse{
		Scores:      topScores,
		TotalPages:  (len(scores) + 4) / 5, // Calculate total pages (5 scores per page)
		CurrentPage: 1,
		PlayerRank:  playerRank,
		Percentile:  percentile,
		Message:     message,
	}, nil
}

// GetScores returns paginated scores
func (ss *ScoreService) GetScores(page int) (*ScoreResponse, error) {
	scores, err := ss.storage.LoadScores()
	if err != nil {
		return nil, fmt.Errorf("failed to load scores: %w", err)
	}

	// Sort by score descending
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Score > scores[j].Score
	})

	// Update ranks
	for i := range scores {
		scores[i].Rank = i + 1
	}

	totalPages := (len(scores) + 4) / 5 // 5 scores per page
	if page < 1 {
		page = 1
	}
	if page > totalPages && totalPages > 0 {
		page = totalPages
	}

	// Get scores for current page
	start := (page - 1) * 5
	end := start + 5
	if end > len(scores) {
		end = len(scores)
	}

	pageScores := []Score{}
	if start < len(scores) {
		pageScores = scores[start:end]
	}

	return &ScoreResponse{
		Scores:      pageScores,
		TotalPages:  totalPages,
		CurrentPage: page,
	}, nil
}

// calculatePercentile calculates the percentile for a given rank
func (ss *ScoreService) calculatePercentile(rank, totalPlayers int) float64 {
	if totalPlayers <= 1 {
		return 100.0
	}
	return ((float64(totalPlayers-rank) / float64(totalPlayers-1)) * 100)
}

// formatRank formats rank number with appropriate suffix
func (ss *ScoreService) formatRank(rank int) string {
	switch rank % 10 {
	case 1:
		if rank%100 != 11 {
			return fmt.Sprintf("%dst", rank)
		}
	case 2:
		if rank%100 != 12 {
			return fmt.Sprintf("%dnd", rank)
		}
	case 3:
		if rank%100 != 13 {
			return fmt.Sprintf("%drd", rank)
		}
	}
	return fmt.Sprintf("%dth", rank)
}

// getTopScores returns the top N scores
func (ss *ScoreService) getTopScores(scores []Score, n int) []Score {
	if len(scores) <= n {
		return scores
	}
	return scores[:n]
}

// ScoreHandler handles HTTP requests for scores
type ScoreHandler struct {
	service *ScoreService
}

// NewScoreHandler creates a new score handler
func NewScoreHandler(service *ScoreService) *ScoreHandler {
	return &ScoreHandler{service: service}
}

// ServeHTTP implements the http.Handler interface
func (sh *ScoreHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case "POST":
		sh.handleSubmitScore(w, r)
	case "GET":
		sh.handleGetScores(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleSubmitScore handles POST requests to submit new scores
func (sh *ScoreHandler) handleSubmitScore(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var submission ScoreSubmission
	if err := json.Unmarshal(body, &submission); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	// Validate submission
	if submission.Name == "" || submission.Score < 0 || submission.Time == "" {
		http.Error(w, "Invalid submission data", http.StatusBadRequest)
		return
	}

	response, err := sh.service.AddScore(submission)
	if err != nil {
		log.Printf("Error adding score: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// handleGetScores handles GET requests to retrieve scores
func (sh *ScoreHandler) handleGetScores(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	page := 1
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	response, err := sh.service.GetScores(page)
	if err != nil {
		log.Printf("Error getting scores: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(response)
}

// initScoreboardAPI initializes the scoreboard API
func initScoreboardAPI() *ScoreHandler {
	storage := NewFileStorage("scores.json")
	service := NewScoreService(storage)
	return NewScoreHandler(service)
}
