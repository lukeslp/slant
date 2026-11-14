package com.oneimpossiblethingatatime.slant;

/** Checks for the pictures the page hands to {@link MainActivity#sharePicture}. */
final class SharedPictures {
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'};
    private static final int MAX_BYTES = 16 * 1024 * 1024;

    private SharedPictures() {}

    /** A plain file name ending in .png; anything else becomes "slant.png". */
    static String safeName(String name) {
        if (name == null) return "slant.png";
        String clean = name.replaceAll("[^A-Za-z0-9._-]", "-");
        if (clean.startsWith(".") || clean.length() > 80 || !clean.endsWith(".png") || clean.length() < 5) return "slant.png";
        return clean;
    }

    /** True for a non-empty PNG of sane size. */
    static boolean isPng(byte[] data) {
        if (data == null || data.length <= PNG.length || data.length > MAX_BYTES) return false;
        for (int i = 0; i < PNG.length; i++) if (data[i] != PNG[i]) return false;
        return true;
    }
}
